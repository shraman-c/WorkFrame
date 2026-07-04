import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdmin, handleApiError } from "@/lib/rbac";
import { createSalaryStructureSchema, payrollQuerySchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

/**
 * GET /api/payroll?employeeId=xxx
 * Admin view of any employee's current + historical salary structures.
 * Without employeeId, returns all employees' current salary.
 */
export async function GET(request: NextRequest) {
  try {
    withAdmin(request);
    const { searchParams } = new URL(request.url);
    const parsed = payrollQuerySchema.safeParse({
      employeeId: searchParams.get("employeeId") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    const { employeeId } = parsed.data;

    if (employeeId) {
      // Single employee — return full history
      const salaries = await prisma.salaryStructure.findMany({
        where: { employeeId },
        orderBy: { effectiveDate: "desc" },
        select: {
          id: true,
          employeeId: true,
          baseSalary: true,
          allowances: true,
          deductions: true,
          netSalary: true,
          effectiveDate: true,
          createdAt: true,
          user: {
            select: {
              employeeId: true,
              profile: { select: { fullName: true } },
            },
          },
        },
      });

      return NextResponse.json({ salaries });
    }

    // All employees — return current (latest) salary per employee
    const allSalaries = await prisma.salaryStructure.findMany({
      orderBy: { effectiveDate: "desc" },
      select: {
        id: true,
        employeeId: true,
        baseSalary: true,
        allowances: true,
        deductions: true,
        netSalary: true,
        effectiveDate: true,
        createdAt: true,
        user: {
          select: {
            employeeId: true,
            profile: { select: { fullName: true } },
          },
        },
      },
    });

    // Deduplicate — keep only the latest per employee
    const seen = new Set<string>();
    const currentSalaries = allSalaries.filter((s) => {
      if (seen.has(s.employeeId)) return false;
      seen.add(s.employeeId);
      return true;
    });

    return NextResponse.json({ salaries: currentSalaries });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/payroll
 * Admin creates a new SalaryStructure row (salary update).
 * Append-only — writes an AuditLog entry for the action.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = withAdmin(request);
    const body = await request.json();
    const parsed = createSalaryStructureSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { employeeId, baseSalary, allowances, deductions, effectiveDate } = parsed.data;

    // Verify the employee exists
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { id: true, employeeId: true },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Compute net salary
    const totalAllowances = Object.values(allowances).reduce((s, v) => s + v, 0);
    const totalDeductions = Object.values(deductions).reduce((s, v) => s + v, 0);
    const netSalary = baseSalary + totalAllowances - totalDeductions;

    const salary = await prisma.salaryStructure.create({
      data: {
        employeeId,
        baseSalary,
        allowances,
        deductions,
        netSalary,
        effectiveDate: new Date(effectiveDate),
      },
      select: {
        id: true,
        employeeId: true,
        baseSalary: true,
        allowances: true,
        deductions: true,
        netSalary: true,
        effectiveDate: true,
        createdAt: true,
      },
    });

    // Audit log
    await logAudit(admin.id, "CREATE_SALARY_STRUCTURE", "SalaryStructure", salary.id);

    return NextResponse.json(salary, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
