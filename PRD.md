# Product Requirements Document

## Human Resource Management System (HRMS)

*Every workday, perfectly aligned.*

**Team:** WorkFrame
**Version:** 1.0
**Status:** Draft
**Date:** July 4, 2026

---

## 1. Document Overview

| Field | Detail |
|---|---|
| Product Name | HRMS – Human Resource Management System |
| Team | WorkFrame |
| Prepared For | Engineering, Design & Stakeholder review |
| Source Document | HRMS Requirements Draft (uploaded) |
| Owner | Product Owner / Project Lead, WorkFrame |
| Status | Draft v1.0 |

---

## 2. Purpose & Vision

The HRMS digitizes and centralizes core human-resource operations — onboarding, profile management, attendance, leave, approvals, and payroll visibility — replacing fragmented spreadsheets and manual approval chains with a single, role-aware web application.

**Vision:** give every employee a self-service home for their work life, and give every HR admin a single control surface to manage the workforce, approve requests, and keep records accurate — with zero training required.

---

## 3. Goals & Objectives

- Reduce time spent on manual attendance and leave tracking by moving to a self-service digital workflow.
- Give employees transparent, real-time visibility into their attendance, leave balance, and payroll.
- Give HR/Admins a single dashboard to manage employees, review attendance, and approve or reject leave requests.
- Establish secure, role-based access so employee-sensitive data (salary, documents) is only visible to authorized roles.
- Lay a foundation that can later extend to performance reviews, recruitment, and payroll processing (out of scope for v1).

---

## 4. Target Users & Personas

| Persona | Description | Primary Needs |
|---|---|---|
| Employee | Regular staff member using the system daily | Check in/out, view attendance, apply for leave, view profile & payslip |
| HR Officer / Admin | Manages workforce operations | Approve/reject leave, monitor attendance, manage employee profiles & payroll |

---

## 5. Scope

### 5.1 In Scope (v1.0)

- Secure Sign Up / Sign In with email verification and role selection (Employee / HR).
- Role-based dashboards for Employee and Admin/HR.
- Employee profile view & limited self-edit; full edit for Admin.
- Daily/weekly attendance tracking with check-in/check-out and status types (Present, Absent, Half-day, Leave).
- Leave application with calendar date-range selection, remarks, and status tracking (Pending/Approved/Rejected).
- Admin leave approval workflow with comments.
- Read-only payroll view for employees; Admin payroll/salary structure control.

### 5.2 Out of Scope (v1.0)

- Automated payroll processing / payslip generation / tax computation.
- Biometric or GPS-based attendance capture.
- Recruitment, onboarding document e-signature, or performance-review modules.
- Mobile native apps (web-responsive only for v1).

---

## 6. User Stories

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| US-1 | New user | sign up with my employee ID, email, password and role | I can access the system securely |
| US-2 | Employee | view my profile, job details, salary and documents | I have transparency into my own records |
| US-3 | Employee | check in and check out each day | my attendance is recorded accurately |
| US-4 | Employee | apply for leave by selecting dates on a calendar | I don't need to email HR manually |
| US-5 | Employee | track the status of my leave request | I know when I can plan time off |
| US-6 | HR/Admin | view all employees' attendance and leave requests | I can manage the workforce centrally |
| US-7 | HR/Admin | approve or reject leave with comments | employees get clear, timely decisions |
| US-8 | HR/Admin | update an employee's salary structure | payroll data stays accurate |

---

## 7. Functional Requirements

### 7.1 Authentication & Authorization

- Users register with Employee ID, Email, Password, and Role (Employee/HR).
- Password must satisfy defined security rules (min length, complexity).
- Email verification required before first login.
- Sign-in via email + password; invalid credentials show a clear inline error.
- Successful login redirects to the role-appropriate dashboard.

### 7.2 Dashboard

- Employee dashboard: quick-access cards for Profile, Attendance, Leave Requests, Logout, plus recent activity/alerts.
- Admin/HR dashboard: employee list, attendance records, leave approvals, and the ability to switch between employees.

### 7.3 Employee Profile Management

- Employees can view personal details, job details, salary structure, documents, and profile picture.
- Employees can edit limited fields: address, phone, profile picture.
- Admin can edit all fields for any employee.

### 7.4 Attendance Management

- Daily and weekly attendance views with check-in/check-out for employees.
- Status types: Present, Absent, Half-day, Leave.
- Employees see only their own attendance; Admin/HR see all employees' attendance.

### 7.5 Leave & Time-Off Management

- Employees choose leave type (Paid, Sick, Unpaid), select a date range on a calendar, and add remarks.
- Monthly calendar view shows Present/Absent markers alongside leave.
- Leave requests move through Pending → Approved/Rejected status.
- Admin/HR views all leave requests, approves or rejects with comments; changes reflect immediately in employee records.

### 7.6 Payroll / Salary Management

- Payroll data is read-only for employees.
- Admin can view all payroll, update salary structures, and ensure payroll accuracy.

---

## 8. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Dashboard and attendance pages should load in under 2 seconds under normal load. |
| Security | Passwords hashed (never stored in plain text); role-based access control enforced server-side; sensitive data (salary, documents) restricted by role. |
| Availability | Target 99.5% uptime for production environment. |
| Usability | Responsive layout supporting desktop and tablet browsers; accessible calendar and forms. |
| Scalability | Architecture should support growth from tens to a few thousand employee records without redesign. |
| Auditability | Leave approvals/rejections and profile edits by Admin should be logged with timestamp and actor. |
| Data Privacy | Compliance with applicable data-protection norms for storing personal and salary information. |

---

## 9. Assumptions & Constraints

- Single organization / tenant in v1 (no multi-company support).
- Email delivery service is available for verification and notification emails.
- Payroll figures are entered/maintained manually by Admin; no integration with external payroll processors in v1.
- Users access the system via modern web browsers; no legacy browser support required.

---

## 10. Dependencies

- Transactional email provider for verification and leave-status notifications.
- File storage for profile pictures and employee documents.
- Calendar UI component for leave date-range selection and monthly attendance view.

---

## 11. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Incorrect leave/attendance data due to manual check-in | Payroll & attendance disputes | Add admin override + audit trail for corrections |
| Sensitive salary data exposure | Privacy/compliance breach | Strict role-based access control + encryption at rest |
| Low adoption if UX is unclear | HR reverts to spreadsheets | Usability testing with pilot group before rollout |

---

## 12. Success Metrics

- ≥90% of employees use self-service check-in/check-out within first month of rollout.
- Average leave-approval turnaround time reduced compared to manual process baseline.
- Reduction in HR support tickets related to attendance/leave discrepancies.

---

## 13. Release Plan (Proposed)

| Phase | Scope | Target |
|---|---|---|
| Phase 1 – MVP | Auth, profile, attendance (check-in/out), leave apply/approve | Weeks 1–6 |
| Phase 2 | Payroll view/control, admin dashboards, notifications | Weeks 7–10 |
| Phase 3 | Reporting, audit logs, polish & hardening | Weeks 11–12 |

---

## 14. Appendix

- Reference wireframes: Excalidraw board — https://link.excalidraw.com/l/65VNwvy7c4X/58RLEJ4oOwh
- Source: HRMS Requirements draft supplied by stakeholder.
- Prepared by: **WorkFrame**
