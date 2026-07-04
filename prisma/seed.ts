import { PrismaClient, Role, AttendanceStatus, LeaveType, LeaveStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────────────────────

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── Main Seed ──────────────────────────────────────────────────────────────

async function main() {
  // Clean up in correct order (foreign keys)
  console.log('🧹 Cleaning database...');
  await prisma.notification.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.salaryStructure.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.attendanceRecord.deleteMany({});
  await prisma.employeeProfile.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.verificationToken.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('✅ Database cleared.\n');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // ==========================================
  // 1. ADMINS (2)
  // ==========================================
  const adminData = [
    { id: 'ADM-001', name: 'Spandan Dhar', title: 'HR Director', email: 'spandan@workframe.com' },
    { id: 'ADM-002', name: 'Sarah Jenkins', title: 'HR Operations Manager', email: 'sarah@workframe.com' },
  ];

  const admins: Awaited<ReturnType<typeof prisma.user.create>>[] = [];
  for (const a of adminData) {
    const user = await prisma.user.create({
      data: {
        employeeId: a.id,
        email: a.email,
        passwordHash: hashedPassword,
        role: Role.ADMIN,
        emailVerified: true,
        profile: {
          create: {
            fullName: a.name,
            phone: `555-010-${a.id.slice(-3)}`,
            address: `${100 + parseInt(a.id.slice(-1))} Corporate Blvd, Suite 200`,
            jobTitle: a.title,
            department: 'Human Resources',
          },
        },
      },
    });
    admins.push(user);
  }
  console.log('✅ 2 Admin accounts seeded.');

  // ==========================================
  // 2. EMPLOYEES (20)
  // ==========================================
  const departments = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Finance', 'Operations'];
  const jobTitlesByDept: Record<string, string[]> = {
    Engineering: ['Software Engineer', 'Senior Software Engineer', 'Frontend Developer', 'Backend Developer', 'DevOps Engineer', 'Tech Lead'],
    Product: ['Product Manager', 'Senior Product Manager', 'Product Analyst'],
    Design: ['UI/UX Designer', 'Senior Designer', 'Graphic Designer'],
    Marketing: ['Marketing Specialist', 'Content Strategist', 'SEO Analyst'],
    Sales: ['Sales Executive', 'Account Manager', 'Business Development Rep'],
    Finance: ['Financial Analyst', 'Accountant', 'Payroll Specialist'],
    Operations: ['Operations Manager', 'HR Coordinator', 'Office Manager'],
  };

  const firstNames = [
    'Arjun', 'Neha', 'Rohan', 'Priya', 'Kabir', 'Ananya', 'Aarav', 'Diya',
    'Vikram', 'Meera', 'Aditya', 'Isha', 'Reyansh', 'Sanya', 'Vivaan',
    'Riya', 'Ayaan', 'Kriti', 'Sai', 'Tara',
  ];
  const lastNames = [
    'Sharma', 'Verma', 'Gupta', 'Mehta', 'Joshi', 'Das', 'Roy', 'Sen',
    'Mishra', 'Patel', 'Nair', 'Reddy', 'Choudhury', 'Kapoor', 'Singh',
    'Malhotra', 'Bose', 'Chatterjee', 'Saxena', 'Rao',
  ];

  const employees: Awaited<ReturnType<typeof prisma.user.create>>[] = [];
  for (let i = 0; i < 20; i++) {
    const empId = `EMP-${String(i + 1).padStart(3, '0')}`;
    const dept = departments[i % departments.length];
    const titles = jobTitlesByDept[dept] || ['Specialist'];
    const title = titles[i % titles.length];

    const user = await prisma.user.create({
      data: {
        employeeId: empId,
        email: `${firstNames[i].toLowerCase()}.${lastNames[i].toLowerCase()}@workframe.com`,
        passwordHash: hashedPassword,
        role: Role.EMPLOYEE,
        emailVerified: true,
        profile: {
          create: {
            fullName: `${firstNames[i]} ${lastNames[i]}`,
            phone: `555-020-${String(i + 1).padStart(4, '0')}`,
            address: `${200 + i} Innovation Drive, Apt ${i + 1}`,
            jobTitle: title,
            department: dept,
          },
        },
      },
    });
    employees.push(user);
  }
  console.log('✅ 20 Employee accounts with profiles seeded.');

  // ==========================================
  // 3. DOCUMENTS (resume + certificates for some employees)
  // ==========================================
  const docCount = await prisma.document.createMany({
    data: employees.slice(0, 15).flatMap((emp, idx) => [
      {
        employeeId: emp.id,
        fileUrl: `/uploads/${emp.id}_resume.pdf`,
        type: 'RESUME',
        uploadedAt: randomDate(daysAgo(60), daysAgo(5)),
      },
      ...(idx % 3 === 0
        ? [
            {
              employeeId: emp.id,
              fileUrl: `/uploads/${emp.id}_cert_aws.pdf`,
              type: 'CERTIFICATE',
              uploadedAt: randomDate(daysAgo(90), daysAgo(10)),
            },
          ]
        : []),
    ]),
  });
  console.log(`✅ ${docCount.count} documents seeded (resumes + certificates).`);

  // ==========================================
  // 4. ATTENDANCE (last 30 business days for all employees)
  // ==========================================
  const attendanceRecords: {
    employeeId: string;
    date: Date;
    checkIn: Date | null;
    checkOut: Date | null;
    status: AttendanceStatus;
  }[] = [];

  for (const emp of employees) {
    for (let dayOffset = 1; dayOffset <= 30; dayOffset++) {
      const date = daysAgo(dayOffset);
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

      const rand = Math.random();
      let status: AttendanceStatus;
      let checkIn: Date | null = null;
      let checkOut: Date | null = null;

      if (rand < 0.7) {
        // 70% present
        status = AttendanceStatus.PRESENT;
        const inHour = 8 + Math.floor(Math.random() * 2); // 8-9 AM
        const outHour = 17 + Math.floor(Math.random() * 2); // 5-6 PM
        checkIn = new Date(date);
        checkIn.setHours(inHour, Math.floor(Math.random() * 60));
        checkOut = new Date(date);
        checkOut.setHours(outHour, Math.floor(Math.random() * 60));
      } else if (rand < 0.85) {
        // 15% absent
        status = AttendanceStatus.ABSENT;
      } else if (rand < 0.92) {
        // 7% half day
        status = AttendanceStatus.HALF_DAY;
        checkIn = new Date(date);
        checkIn.setHours(9, Math.floor(Math.random() * 30));
        checkOut = new Date(date);
        checkOut.setHours(13, Math.floor(Math.random() * 60));
      } else {
        // 8% on leave
        status = AttendanceStatus.LEAVE;
      }

      attendanceRecords.push({
        employeeId: emp.id,
        date,
        checkIn,
        checkOut,
        status,
      });
    }
  }

  // Insert all at once
  await prisma.attendanceRecord.createMany({ data: attendanceRecords, skipDuplicates: true });
  console.log(`✅ ${attendanceRecords.length} attendance records seeded (last 30 business days).`);

  // ==========================================
  // 5. LEAVE REQUESTS (various statuses)
  // ==========================================
  const leaveTypes: LeaveType[] = [LeaveType.PAID, LeaveType.SICK, LeaveType.UNPAID];
  const remarksPool = [
    'Family vacation planned months in advance.',
    'Feeling unwell, need rest.',
    'Personal reasons.',
    'Attending a wedding out of state.',
    'Medical appointment.',
    'Moving to a new apartment.',
    'Mental health day.',
    'Urgent family matter.',
    'Child is sick, need to stay home.',
    'Traveling for personal reasons.',
  ];
  const reviewerComments = [
    'Approved. Enjoy your time off!',
    'Approved. Take care.',
    'Request does not meet company policy for this leave type.',
    'Please provide additional documentation.',
    'Approved with noted reason.',
    'Rejected due to project deadline.',
    null,
    null,
  ];

  const leaveRequests: {
    employeeId: string;
    leaveType: LeaveType;
    startDate: Date;
    endDate: Date;
    remarks: string;
    status: LeaveStatus;
    reviewerComment: string | null;
    reviewedBy: string | null;
    createdAt: Date;
  }[] = [];

  for (let i = 0; i < 40; i++) {
    const emp = employees[i % employees.length];
    const startOffset = Math.floor(Math.random() * 30) + 1;
    const durationDays = Math.floor(Math.random() * 5) + 1;
    const start = daysAgo(startOffset);
    const end = new Date(start);
    end.setDate(end.getDate() + durationDays);

    const statusRand = Math.random();
    let status: LeaveStatus;
    let reviewerComment: string | null = null;
    let reviewedBy: string | null = null;

    if (statusRand < 0.3) {
      status = LeaveStatus.PENDING;
    } else if (statusRand < 0.7) {
      status = LeaveStatus.APPROVED;
      reviewerComment = randomItem(reviewerComments.filter(Boolean));
      reviewedBy = randomItem(admins).id;
    } else {
      status = LeaveStatus.REJECTED;
      reviewerComment = randomItem(reviewerComments.filter(Boolean));
      reviewedBy = randomItem(admins).id;
    }

    leaveRequests.push({
      employeeId: emp.id,
      leaveType: randomItem(leaveTypes),
      startDate: start,
      endDate: end,
      remarks: randomItem(remarksPool),
      status,
      reviewerComment,
      reviewedBy,
      createdAt: daysAgo(startOffset + Math.floor(Math.random() * 5) + 1),
    });
  }

  for (const lr of leaveRequests) {
    await prisma.leaveRequest.create({ data: lr });
  }

  const pendingCount = leaveRequests.filter((r) => r.status === LeaveStatus.PENDING).length;
  const approvedCount = leaveRequests.filter((r) => r.status === LeaveStatus.APPROVED).length;
  const rejectedCount = leaveRequests.filter((r) => r.status === LeaveStatus.REJECTED).length;
  console.log(`✅ 40 leave requests seeded (${pendingCount} pending, ${approvedCount} approved, ${rejectedCount} rejected).`);

  // ==========================================
  // 6. SALARY STRUCTURES (for all employees)
  // ==========================================
  const salaryData = employees.map((emp, i) => {
    const baseSalary = 50000 + Math.floor(Math.random() * 80000); // $50k-$130k
    const hra = Math.round(baseSalary * 0.2);
    const transport = Math.round(baseSalary * 0.05);
    const medical = Math.round(baseSalary * 0.03);
    const tax = Math.round(baseSalary * 0.22);
    const pf = Math.round(baseSalary * 0.12);
    const netSalary = baseSalary + hra + transport + medical - tax - pf;

    return {
      employeeId: emp.id,
      baseSalary,
      allowances: { hra, transport, medical },
      deductions: { tax, pf },
      netSalary,
      effectiveDate: daysAgo(90 + i * 3),
    };
  });

  await prisma.salaryStructure.createMany({ data: salaryData });
  console.log(`✅ ${salaryData.length} salary structures seeded.`);

  // ==========================================
  // 7. NOTIFICATIONS (for various employees)
  // ==========================================
  const notifMessages = [
    { type: 'LEAVE_DECISION' as const, msg: 'Your paid leave request has been approved.' },
    { type: 'LEAVE_DECISION' as const, msg: 'Your sick leave request has been rejected. Reason: Insufficient documentation.' },
    { type: 'LEAVE_DECISION' as const, msg: 'Your unpaid leave request is still pending review.' },
    { type: 'GENERAL' as const, msg: 'Welcome to WorkFrame! Complete your profile to get started.' },
    { type: 'GENERAL' as const, msg: 'Company all-hands meeting scheduled for next Friday.' },
    { type: 'SYSTEM' as const, msg: 'Your password was successfully changed.' },
    { type: 'GENERAL' as const, msg: 'New policy update: Remote work guidelines have been updated.' },
    { type: 'SYSTEM' as const, msg: 'Your email has been verified successfully.' },
  ];

  const notifs = employees.slice(0, 12).flatMap((emp) =>
    Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map(() => {
      const n = randomItem(notifMessages);
      return {
        userId: emp.id,
        type: n.type,
        message: n.msg,
        isRead: Math.random() > 0.5,
        createdAt: randomDate(daysAgo(14), daysAgo(1)),
      };
    })
  );

  await prisma.notification.createMany({ data: notifs });
  console.log(`✅ ${notifs.length} notifications seeded.`);

  // ==========================================
  // 8. AUDIT LOGS
  // ==========================================
  const auditActions = [
    { action: 'LEAVE_APPROVED', entity: 'LeaveRequest' },
    { action: 'LEAVE_REJECTED', entity: 'LeaveRequest' },
    { action: 'PROFILE_UPDATE', entity: 'EmployeeProfile' },
    { action: 'SALARY_UPDATE', entity: 'SalaryStructure' },
    { action: 'DOCUMENT_UPLOAD', entity: 'Document' },
    { action: 'ATTENDANCE_CHECK_IN', entity: 'AttendanceRecord' },
    { action: 'ATTENDANCE_CHECK_OUT', entity: 'AttendanceRecord' },
  ];

  const auditLogs = Array.from({ length: 50 }).map(() => {
    const a = randomItem(auditActions);
    return {
      actorId: randomItem([...admins, ...employees.slice(0, 10)]).id,
      action: a.action,
      targetEntity: a.entity,
      targetId: `placeholder-${Math.floor(Math.random() * 100)}`,
      timestamp: randomDate(daysAgo(30), daysAgo(1)),
    };
  });

  await prisma.auditLog.createMany({ data: auditLogs });
  console.log(`✅ ${auditLogs.length} audit log entries seeded.`);

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n🚀 Seeding complete!\n');
  console.log('   Summary:');
  console.log(`   - ${admins.length} admins`);
  console.log(`   - ${employees.length} employees`);
  console.log(`   - ${docCount.count} documents`);
  console.log(`   - ${attendanceRecords.length} attendance records`);
  console.log(`   - ${leaveRequests.length} leave requests (${pendingCount} pending)`);
  console.log(`   - ${salaryData.length} salary structures`);
  console.log(`   - ${notifs.length} notifications`);
  console.log(`   - ${auditLogs.length} audit logs`);
  console.log('\n   Login password for all accounts: password123');
  console.log('\n   Admin emails: spandan@workframe.com, sarah@workframe.com');
  console.log('   Employee emails: {firstname}.{lastname}@workframe.com');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
