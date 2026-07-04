const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function test(label, fn) {
  try {
    const result = await fn();
    console.log(`✅ ${label}: OK`);
    return result;
  } catch (e) {
    console.error(`❌ ${label}: ERROR`);
    console.error(`   Message: ${e.message}`);
    console.error(`   Code: ${e.code || "N/A"}`);
    console.error(`   Meta: ${JSON.stringify(e.meta || {})}`);
    return null;
  }
}

async function main() {
  console.log("--- Testing Prisma Queries ---\n");

  await test("user.findMany (employees)", () =>
    p.user.findMany({
      select: {
        id: true, employeeId: true, email: true, role: true,
        profile: { select: { fullName: true, jobTitle: true, department: true } },
      },
    })
  );

  await test("user.findUnique (me/profile)", () =>
    p.user.findUnique({
      where: { id: "test" },
      select: {
        id: true, employeeId: true, email: true, role: true, createdAt: true,
        profile: { select: { fullName: true, phone: true, address: true, jobTitle: true, department: true, profilePictureUrl: true } },
        documents: { select: { id: true, fileUrl: true, type: true, uploadedAt: true }, orderBy: { uploadedAt: "desc" } },
      },
    })
  );

  await test("attendanceRecord.findMany", () =>
    p.attendanceRecord.findMany({
      where: { employeeId: "test" },
      orderBy: { date: "desc" },
      select: { id: true, date: true, checkIn: true, checkOut: true, status: true },
    })
  );

  await test("leaveRequest.findMany (me)", () =>
    p.leaveRequest.findMany({
      where: { employeeId: "test" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, leaveType: true, startDate: true, endDate: true,
        remarks: true, status: true, reviewerComment: true, createdAt: true,
        reviewer: { select: { id: true, profile: { select: { fullName: true } } } },
      },
    })
  );

  await test("leaveRequest.findMany (admin - all)", () =>
    p.leaveRequest.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, leaveType: true, startDate: true, endDate: true,
        remarks: true, status: true, reviewerComment: true, createdAt: true,
        user: {
          select: {
            id: true, employeeId: true,
            profile: { select: { fullName: true } },
          },
        },
        reviewer: {
          select: { id: true, profile: { select: { fullName: true } } },
        },
      },
    })
  );

  await test("salaryStructure.findMany", () =>
    p.salaryStructure.findMany({
      where: { employeeId: "test" },
      orderBy: { effectiveDate: "desc" },
      select: {
        id: true, baseSalary: true, allowances: true,
        deductions: true, netSalary: true, effectiveDate: true, createdAt: true,
      },
    })
  );

  await test("notification.findMany", () =>
    p.notification.findMany({
      where: { userId: "test" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, type: true, message: true, isRead: true, createdAt: true },
    })
  );

  await test("auditLog.findMany", () =>
    p.auditLog.findMany({
      where: { actorId: "test" },
      orderBy: { timestamp: "desc" },
      take: 20,
      select: { id: true, action: true, targetEntity: true, targetId: true, timestamp: true },
    })
  );

  console.log("\n--- Done ---");
}

main()
  .catch((e) => {
    console.error("FATAL:", e.message);
  })
  .finally(() => p.$disconnect());
