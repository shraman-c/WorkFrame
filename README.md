# WorkFrame

WorkFrame is a full-stack Human Resource Management System built with Next.js, Prisma, and PostgreSQL. It provides a role-based portal for employees and HR administrators to manage profiles, attendance, leave requests, documents, payroll visibility, and notifications.

📖 **[Complete Setup & Usage Guide →](INSTRUCTIONS.md)**

## Why WorkFrame?

| Advantage | Description |
|-----------|-------------|
| **Self-Hosted & Free** | Run on your infrastructure, no per-user SaaS fees |
| **Modern Stack** | Next.js 14, React 18, Tailwind CSS, Prisma ORM |
| **Secure by Default** | JWT auth, bcrypt, RBAC, audit logging |
| **Extensible** | Modular architecture for custom workflows |
| **Production-Ready** | TypeScript, validation, error handling, seed data |

## Features

- **Authentication** — Secure sign-up/sign-in with email verification, JWT + refresh tokens, bcrypt hashing
- **Role-Based Access** — Employee, HR Manager, and Admin dashboards with granular permissions
- **Employee Management** — Profiles, documents, employment history, profile pictures
- **Attendance Tracking** — Real-time clock in/out, geolocation, admin oversight, monthly reports
- **Leave Management** — Multiple leave types, accrual rules, multi-level approvals, calendar view
- **Payroll Visibility** — Salary structures, payslip generation, tax tracking, payment history
- **Notifications & Audit** — Real-time in-app + email notifications, comprehensive audit logs

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

- Node.js 18+
- npm or pnpm
- PostgreSQL database

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a .env file in the project root with the following variables:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-app-password"
NODE_ENV="development"
```

4. Generate Prisma client and apply the schema:

```bash
npx prisma generate
npx prisma db push
```

5. Seed the database with demo users and sample records:

```bash
npx prisma db seed
```

## Running the App

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Demo Accounts

The seed data creates sample accounts such as:

- Admin: sarah@workframe.com / password123
- Employee: arjun.sharma@workframe.com / password123

## Available Scripts

- npm run dev — start the development server
- npm run build — create a production build
- npm run start — run the production build
- npm run lint — run lint checks
- npm run db:generate — generate Prisma client
- npm run db:push — push schema changes to the database
- npm run db:migrate — create and apply migrations
- npm run db:studio — open Prisma Studio

## Screenshots

### Activity Log
![Activity Log](public/images/workframe-activity-log.png)

### Attendance - Admin View
![Attendance Admin](public/images/workframe-attendance-admin.png)

### Attendance - Clock In/Out
![Attendance Clock In](public/images/workframe-attendance-clockin.png)

### Employees Management
![Employees](public/images/workframe-employees.png)

### Time Off Requests
![Time Off](public/images/workframe-time-off.png)

## License

WorkFrame is **dual-licensed**:

1. **Community License** — GNU AGPL v3.0
   - Use, modify, redistribute under AGPL v3.0 terms
   - Source-code and network-interaction requirements apply
   - [View License](https://www.gnu.org/licenses/agpl-3.0.html)

2. **Commercial License** — For organizations needing rights outside AGPL v3.0
   - Contact the copyright holder for terms
   - Enables proprietary distribution and SaaS offerings

See [LICENSE](LICENSE) for full terms.

## Copyright & Contributors

**Copyright © 2026 Shraman Chaudhuri, Spandan Dhar, Pragati Kumar, and Sampad Ghosh. All rights reserved.**

| Contributor | Role | Copyright |
|-------------|------|-----------|
| Shraman Chaudhuri | Creator & Maintainer | © 2026 Shraman Chaudhuri |
| Spandan Dhar | Co-Creator & Contributor | © 2026 Spandan Dhar |
| Pragati Kumar | Co-Creator & Contributor | © 2026 Pragati Kumar |
| Sampad Ghosh | Co-Creator & Contributor | © 2026 Sampad Ghosh |

All contributions are made under the project's dual license. Contributors retain copyright to their individual contributions while granting necessary rights under the applicable licenses.

## Notes

This project is intended as a modern HR management starter with a focus on secure access, employee self-service, and administrative workflows. Additional features such as deeper payroll automation and advanced reporting can be added later.

