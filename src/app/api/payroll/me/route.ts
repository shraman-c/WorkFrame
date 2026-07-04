import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, handleApiError } from "@/lib/rbac";

/**
 * GET /api/payroll/me
 * Employee reads their own current salary structure (read-only, no write route for EMPLOYEE).
 * Returns the latest salary row based on effectiveDate, or null if none exists.
 */
export async function GET(request: NextRequest) {
  try {
    const user = withAuth(request);

    // Fetch all salary rows for the employee, newest first
    const salaries = await prisma.salaryStructure.findMany({
      where: { employeeId: user.id },
      orderBy: { effectiveDate: "desc" },
      select: {
        id: true,
        baseSalary: true,
        allowances: true,
        deductions: true,
        netSalary: true,
        effectiveDate: true,
        createdAt: true,
      },
    });

    const current = salaries[0] || null;

    return NextResponse.json({
      current,
      history: salaries,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
