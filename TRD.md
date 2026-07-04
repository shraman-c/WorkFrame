# Technical Requirements Document

## Human Resource Management System (HRMS)

*Engineering blueprint for architecture, data model, and APIs*

**Team:** WorkFrame
**Version:** 1.0
**Status:** Draft
**Date:** July 4, 2026

---

## 1. Overview

This document translates the HRMS Product Requirements into a concrete technical design: architecture, data model, APIs, security, and non-functional implementation details. It assumes a modern web-first delivery and is technology-agnostic where possible, with a recommended stack called out explicitly.

---

## 2. Recommended Technology Stack

No stack was mandated in the source requirements; the following is a recommended, pragmatic default for a role-based CRUD-heavy web app with calendar UI and approval workflows.

| Layer | Recommendation |
|---|---|
| Frontend | React / Next.js (TypeScript), Tailwind CSS for styling |
| Backend | Node.js (NestJS or Express) or equivalent REST/GraphQL API layer |
| Database | PostgreSQL (relational — strong fit for role/approval/audit data) |
| ORM | Prisma or TypeORM |
| Auth | JWT-based session tokens + refresh tokens; bcrypt/argon2 password hashing |
| Email | Transactional email provider (e.g. SES, SendGrid, Postmark) for verification & notifications |
| File storage | S3-compatible object storage for profile pictures & documents |
| Hosting | Containerized deployment (Docker) on a managed cloud (AWS/GCP/Azure) or PaaS |

---

## 3. System Architecture

Three-tier architecture: client (SPA), application/API server, and relational database, with supporting services for email and file storage.

```
[ Browser (React SPA) ]
        |  HTTPS / REST (JSON)
        v
[ API Server (Auth, Business Logic, RBAC) ]
        |            |
        v            v
[ PostgreSQL ]   [ Object Storage / Email Service ]
```

### 3.1 Key Architectural Principles

- Stateless API servers — session state carried in signed JWTs, horizontally scalable.
- Role-Based Access Control (RBAC) enforced at the API layer, not just the UI.
- All salary/document reads pass through an authorization check comparing requester role + identity to the target employee record.
- Calendar-driven features (attendance, leave) share a common date-range/status service to avoid duplicated logic.

---

## 4. Data Model

Core entities and relationships derived from the functional requirements:

| Entity | Key Fields | Notes |
|---|---|---|
| User | id, employeeId, email, passwordHash, role (EMPLOYEE/ADMIN), emailVerified, createdAt | Root auth entity |
| EmployeeProfile | userId (FK), fullName, phone, address, jobTitle, department, profilePictureUrl | 1:1 with User |
| SalaryStructure | employeeId (FK), baseSalary, allowances, deductions, effectiveDate | Admin-writable, employee read-only |
| Document | id, employeeId (FK), fileUrl, type, uploadedAt | Personal documents |
| AttendanceRecord | id, employeeId (FK), date, checkIn, checkOut, status (PRESENT/ABSENT/HALF_DAY/LEAVE) | One row per employee per day |
| LeaveRequest | id, employeeId (FK), leaveType (PAID/SICK/UNPAID), startDate, endDate, remarks, status (PENDING/APPROVED/REJECTED), reviewerComment, reviewedBy (FK) | Drives leave calendar & approvals |
| AuditLog | id, actorId (FK), action, targetEntity, targetId, timestamp | Tracks admin edits & approval decisions |

### 4.1 Relationships

- User 1—1 EmployeeProfile
- User 1—N SalaryStructure (history over time, latest = current)
- User 1—N Document
- User 1—N AttendanceRecord
- User 1—N LeaveRequest; LeaveRequest N—1 reviewer (User with ADMIN role)

---

## 5. API Design (Representative Endpoints)

| Method & Path | Purpose | Access |
|---|---|---|
| POST /auth/signup | Register with employeeId, email, password, role | Public |
| POST /auth/verify-email | Confirm email verification token | Public |
| POST /auth/signin | Authenticate, return JWT | Public |
| GET /me/profile | Fetch own profile, job details, salary, documents | Employee/Admin |
| PATCH /me/profile | Edit own address/phone/photo | Employee |
| PATCH /employees/:id | Edit any employee's full profile | Admin |
| GET /attendance/me?range= | Own attendance (daily/weekly) | Employee |
| POST /attendance/check-in | Record check-in timestamp | Employee |
| POST /attendance/check-out | Record check-out timestamp | Employee |
| GET /attendance?employeeId= | All/specific employee attendance | Admin |
| POST /leave-requests | Apply for leave (type, dateRange, remarks) | Employee |
| GET /leave-requests/me | Own leave requests & statuses | Employee |
| GET /leave-requests | All leave requests | Admin |
| PATCH /leave-requests/:id/decision | Approve/Reject with comment | Admin |
| GET /payroll/me | Own payroll (read-only) | Employee |
| GET /payroll?employeeId= | View/update salary structure | Admin |

---

## 6. Authentication & Security

- Passwords hashed with bcrypt/argon2, never stored or logged in plaintext.
- Email verification token expires (e.g. 24h) and is single-use.
- JWT access tokens short-lived (~15 min); refresh tokens rotated and stored httpOnly/secure.
- RBAC middleware on every route: Employee routes scoped to `req.user.id`; Admin routes require `role === ADMIN`.
- Field-level authorization: salary and document fields excluded from API responses unless requester is the owner or an Admin.
- All admin write actions (profile edits, leave decisions, salary updates) written to AuditLog.
- Standard protections: HTTPS everywhere, input validation/sanitization, rate limiting on auth endpoints, CSRF protection for cookie-based flows.

---

## 7. Non-Functional Implementation Details

| Category | Implementation Approach |
|---|---|
| Performance | Paginate employee/attendance/leave list endpoints; index on employeeId + date columns; cache dashboard aggregates briefly. |
| Scalability | Stateless API layer behind a load balancer; DB read replicas if reporting load grows. |
| Availability | Health checks + auto-restart; daily automated DB backups; blue-green or rolling deploys. |
| Observability | Structured logging, request tracing, and error alerting (e.g. Sentry) from day one. |
| Data Privacy | Encrypt sensitive fields at rest where supported; restrict document storage bucket to signed, time-limited URLs. |

---

## 8. Third-Party Integrations

- Transactional email service for verification links and leave-decision notifications.
- Object storage (S3-compatible) for profile pictures and employee documents, served via signed URLs.
- Optional: calendar/ICS export for approved leave, if later required.

---

## 9. Deployment & Environments

| Environment | Purpose |
|---|---|
| Local/Dev | Developer machines; seeded test data; mocked email sending |
| Staging | Pre-production QA, mirrors production config with test data |
| Production | Live environment; automated backups; restricted admin access |

CI/CD: automated lint, type-check, unit/integration tests, and preview deploys on pull requests; migrations applied via versioned DB migration tool (e.g. Prisma Migrate) as part of the deploy pipeline.

---

## 10. Testing Strategy

- Unit tests for business logic: leave-status transitions, attendance status computation, RBAC guards.
- Integration tests for API endpoints, especially cross-role access control (employee cannot read another employee's salary).
- End-to-end tests for critical flows: signup → verify → login, apply-leave → approve/reject, check-in/check-out.
- Security testing: verify password policy enforcement, JWT expiry/rotation, and field-level data exposure.

---

## 11. Open Technical Questions

- Should leave balances (accrual per leave type) be tracked explicitly, or is unlimited leave application acceptable for v1?
- Is single-organization sufficient, or should the schema anticipate multi-tenant HRMS use from the start?
- What identity source of truth exists today (if any) that HRMS user records need to reconcile with?

---

## 12. Appendix

- Reference wireframes: Excalidraw board — https://link.excalidraw.com/l/65VNwvy7c4X/58RLEJ4oOwh
- This TRD should be read alongside the companion PRD (`HRMS_PRD.md`) for product rationale and scope decisions.
- Prepared by: **WorkFrame**
