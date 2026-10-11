# WorkFrame - Complete Setup & Usage Guide

## Overview

WorkFrame is a full-stack Human Resource Management System built with Next.js, Prisma, and PostgreSQL. It provides a role-based portal for employees and HR administrators to manage profiles, attendance, leave requests, documents, payroll visibility, and notifications.

---

## Why Choose WorkFrame?

### Key Advantages

| Feature | Benefit |
|---------|---------|
| **Role-Based Access Control** | Separate dashboards for employees and admins with granular permissions |
| **Modern Tech Stack** | Built on Next.js 14+, React 18, Tailwind CSS, and Prisma ORM |
| **Secure Authentication** | JWT-based auth with refresh tokens, bcrypt password hashing, and email verification |
| **Real-Time Notifications** | In-app notification system with audit logging |
| **Self-Service Portal** | Employees manage their own profiles, attendance, and leave requests |
| **Admin Workflows** | Approval chains, bulk operations, and comprehensive reporting |
| **Extensible Architecture** | Modular codebase ready for customization |

### Use Cases

- Small to medium businesses needing a lightweight HR solution
- Startups wanting to avoid expensive SaaS subscriptions
- Teams requiring on-premise data control
- Developers building custom HR tools on a solid foundation

---

## Features Deep Dive

### 1. Authentication & Security
- Secure sign-up with email verification
- JWT access + refresh token rotation
- Bcrypt password hashing (cost factor 12)
- Role-based authorization (Employee / Admin / HR)
- Session management and automatic token refresh

### 2. Employee Management
- Complete profile management (personal info, contact, emergency contacts)
- Document uploads (contracts, IDs, certificates) with type validation
- Employment history and position tracking
- Profile picture support with automatic optimization

### 3. Attendance Tracking
- Real-time check-in/check-out with geolocation support
- Admin dashboard for attendance oversight
- Late arrival / early departure detection
- Monthly attendance reports
- Manual correction workflows for admins

### 4. Leave Management
- Multiple leave types (Annual, Sick, Personal, Maternity/Paternity, etc.)
- Configurable leave balances and accrual rules
- Multi-level approval workflows
- Calendar view with team visibility
- Leave history and balance tracking

### 5. Payroll Visibility
- Salary structure management
- Payslip generation and download
- Tax deduction tracking
- Payment history
- Employee self-service payslip access

### 6. Notifications & Audit
- Real-time in-app notifications
- Email notifications for critical events
- Comprehensive audit logging for compliance
- Notification preferences per user

---
## Tech Stack

- Frontend: Next.js, React, Tailwind CSS
- Backend: Next.js API routes
- Database: PostgreSQL with Prisma ORM
- Authentication: JWT + bcryptjs
- Email: Nodemailer-compatible SMTP

## Project Structure

- app/ contains the main Next.js pages and API routes
- components/ contains reusable UI components
- lib/ contains authentication, Prisma, validation, and notification helpers
- prisma/ contains the database schema and seed data

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 18+ |
| npm / pnpm | Latest |
| PostgreSQL | 14+ |
| Git | Latest |

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/WorkFrame.git
cd WorkFrame
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Authentication
JWT_ACCESS_SECRET="your-super-secret-access-key-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-chars"

# Email (SMTP)
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-app-password"

# Application
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with demo data
npx prisma db seed
```

### 5. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Demo Accounts

After seeding, the following accounts are available:

| Role | Email | Password |
|------|-------|----------|
| Admin | sarah@workframe.com | password123 |
| HR Manager | hr@workframe.com | password123 |
| Employee | arjun.sharma@workframe.com | password123 |
| Employee | priya.patel@workframe.com | password123 |

---

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Create production build
npm run start        # Run production build
npm run lint         # Run lint checks
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:migrate   # Create and apply migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database
```

---

## Project Structure

```
WorkFrame/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/               # API endpoints
│   ├── attendance/        # Attendance pages
│   ├── dashboard/         # Role-based dashboards
│   ├── employees/         # Employee management
│   ├── leave/             # Leave management
│   ├── payroll/           # Payroll pages
│   └── profile/           # Profile management
├── components/            # Reusable React components
├── lib/                   # Core utilities
│   ├── auth.ts           # Authentication logic
│   ├── prisma.ts         # Prisma client
│   ├── rbac.ts           # Role-based access control
│   ├── validation.ts     # Zod schemas
│   └── ...
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data
├── public/               # Static assets
│   └── images/           # Screenshots & uploads
├── .env.example          # Environment template
└── README.md             # Project documentation
```

---

## Configuration

### Role Permissions

Default roles and their permissions:

- **Employee**: View own profile, clock in/out, request leave, view payslips
- **HR Manager**: All employee permissions + approve leave, manage employees, view reports
- **Admin**: Full system access including user management, settings, audit logs

### Leave Types Configuration

Edit `prisma/seed.ts` to customize leave types, balances, and accrual rates.

### Email Templates

Modify `lib/email.ts` to customize notification emails.

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production

```env
NODE_ENV="production"
DATABASE_URL="postgresql://..."
JWT_ACCESS_SECRET="..."
JWT_REFRESH_SECRET="..."
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow existing TypeScript/React patterns
- Run `npm run lint` before committing
- Write meaningful commit messages
- Add tests for new features

---

## License

WorkFrame is dual-licensed. See [LICENSE](LICENSE) for details.

---

## Support

- **Issues**: GitHub Issues
- **Commercial Licensing**: Contact copyright holder
- **Documentation**: This guide and inline code comments

---

## Copyright & Contributors

**Copyright © 2026 Shraman Chaudhuri. All rights reserved.**

### Contributors

| Name | Role | Copyright Status |
|------|------|------------------|
| Shraman Chaudhuri | Creator & Maintainer | © 2026 Shraman Chaudhuri |

All contributions are made under the terms of the project's dual license (AGPL v3.0 / Commercial). Contributors retain copyright to their individual contributions while granting the project the necessary rights under the applicable licenses.

---

## Changelog

### v1.0.0 (2026)
- Initial release
- Employee & Admin dashboards
- Attendance tracking
- Leave management
- Payroll visibility
- Notifications & audit logging