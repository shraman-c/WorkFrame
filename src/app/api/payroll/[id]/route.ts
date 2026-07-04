import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdmin, handleApiError } from "@/lib/rbac";
import { createSalaryStructureSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

interface RouteParams {
  params: { id: string };
}

/**
 * PATCH /api/payroll/:id
 * Admin-only: update an existing SalaryStructure row.
 * Append-only semantics are preserved — this creates a new record
 * with the updated values and the current date as effectiveDate,
 * then logs the action to AuditLog.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = withAdmin(request);
    const { id } = params;
    const body = await request.json();
    const parsed = createSalaryStructureSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { employeeId, baseSalary, allowances, deductions, effectiveDate } = parsed.data;

    // Verify the target salary structure exists
    const existing = await prisma.salaryStructure.findUnique({
      where: { id },
      select: { id: true, employeeId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Salary record not found" }, { status: 404 });
    }

    // Verify the employee ID matches the existing record
    if (parsed.data.employeeId !== existing.employeeId) {
      return NextResponse.json(
        { error: "Cannot reassign salary record to a different employee" },
        { status: 400 }
      );
    }

    // Verify the employee exists
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { id: true, loginId: true },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Compute net salary
    const totalAllowances = Object.values(allowances).reduce((s, v) => s + v, 0);
    const totalDeductions = Object.values(deductions).reduce((s, v) => s + v, 0);
    const netSalary = baseSalary + totalAllowances - totalDeductions;

    // Create a new record (append-only audit trail)
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
    await logAudit(admin.id, "UPDATE_SALARY_STRUCTURE", "SalaryStructure", salary.id);

    return NextResponse.json(salary, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
