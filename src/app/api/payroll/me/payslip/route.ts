import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withAdmin, handleApiError } from "@/lib/rbac";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/**
 * GET /api/payroll/me/payslip
 * Generates and streams a PDF payslip for the authenticated employee.
 * Owner-or-Admin gated: employees see their own payslips, admins can
 * pass ?employeeId=xxx to view any employee's payslip.
 * Query params: ?salaryId=xxx (optional), ?employeeId=xxx (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const authedUser = withAuth(request);
    const { searchParams } = new URL(request.url);
    const salaryId = searchParams.get("salaryId");
    const targetEmployeeId = searchParams.get("employeeId");

    // If an employeeId is provided, only admins can use it (owner-or-Admin gating)
    let employeeId = authedUser.id;
    if (targetEmployeeId && targetEmployeeId !== authedUser.id) {
      // Must be admin to view another employee's payslip
      withAdmin(request);
      employeeId = targetEmployeeId;
    }

    // Build the where clause
    const where: Record<string, string> = { employeeId };
    if (salaryId) {
      where.id = salaryId;
    }

    // Fetch the salary row
    const salary = await prisma.salaryStructure.findFirst({
      where,
      orderBy: { effectiveDate: "desc" },
      select: {
        id: true,
        baseSalary: true,
        allowances: true,
        deductions: true,
        netSalary: true,
        effectiveDate: true,
        user: {
          select: {
            id: true,
            employeeId: true,
            email: true,
            profile: { select: { fullName: true, jobTitle: true, department: true } },
          },
        },
      },
    });

    if (!salary) {
      return NextResponse.json({ error: "No salary record found" }, { status: 404 });
    }

    // Generate PDF payslip
    const pdfDoc = await PDFDocument.create();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([595, 842]); // A4
    const { width } = page.getSize();

    const margin = 50;
    let y = 780;

    // Helper to draw text
    const drawText = (
      text: string,
      x: number,
      yPos: number,
      font: typeof helvetica = helvetica,
      fontSize: number = 11,
      color = rgb(0.1, 0.1, 0.1)
    ) => {
      page.drawText(text, { x, y: yPos, font, size: fontSize, color });
    };

    // ── Header ──
    drawText("WORKFRAME HRMS", margin, y, helveticaBold, 18, rgb(0.92, 0.7, 0.05));
    y -= 10;
    drawText("PAYSLIP", margin, y, helveticaBold, 14, rgb(0.1, 0.1, 0.1));
    y -= 30;

    // ── Separator ──
    page.drawLine({
      start: { x: margin, y: y + 5 },
      end: { x: width - margin, y: y + 5 },
      thickness: 1,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= 10;

    // ── Employee Info ──
    const employeeName = salary.user.profile?.fullName || "N/A";
    const empId = salary.user.employeeId;
    const department = salary.user.profile?.department || "N/A";
    const payPeriod = salary.effectiveDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    drawText("Employee Name:", margin, y, helvetica, 10, rgb(0.4, 0.4, 0.4));
    drawText(employeeName, margin + 90, y, helveticaBold, 10);
    drawText("Employee ID:", width / 2, y, helvetica, 10, rgb(0.4, 0.4, 0.4));
    drawText(empId, width / 2 + 90, y, helveticaBold, 10);
    y -= 18;

    drawText("Department:", margin, y, helvetica, 10, rgb(0.4, 0.4, 0.4));
    drawText(department, margin + 90, y, helveticaBold, 10);
    drawText("Pay Period:", width / 2, y, helvetica, 10, rgb(0.4, 0.4, 0.4));
    drawText(payPeriod, width / 2 + 90, y, helveticaBold, 10);
    y -= 30;

    // ── Separator ──
    page.drawLine({
      start: { x: margin, y: y + 5 },
      end: { x: width - margin, y: y + 5 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
    y -= 15;

    // ── Earnings ──
    drawText("EARNINGS", margin, y, helveticaBold, 12);
    y -= 22;

    drawText("Base Salary", margin, y, helvetica, 11);
    drawText(`$${salary.baseSalary.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, width - margin - 80, y, helveticaBold, 11);
    y -= 18;

    const allowances = salary.allowances as Record<string, number>;
    for (const [key, value] of Object.entries(allowances)) {
      if (value > 0) {
        drawText(key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), margin + 15, y, helvetica, 10);
        drawText(`$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, width - margin - 80, y, helvetica, 10);
        y -= 16;
      }
    }

    const totalAllowances = Object.values(allowances).reduce((s, v) => s + v, 0);
    y -= 4;
    page.drawLine({
      start: { x: margin + 15, y: y + 5 },
      end: { x: width - margin, y: y + 5 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    drawText("Total Allowances", margin + 15, y, helveticaBold, 10);
    drawText(`$${totalAllowances.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, width - margin - 80, y, helveticaBold, 10);
    y -= 25;

    // ── Deductions ──
    drawText("DEDUCTIONS", margin, y, helveticaBold, 12);
    y -= 22;

    const deductions = salary.deductions as Record<string, number>;
    for (const [key, value] of Object.entries(deductions)) {
      if (value > 0) {
        drawText(key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), margin + 15, y, helvetica, 10);
        drawText(`-$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, width - margin - 80, y, helvetica, 10);
        y -= 16;
      }
    }

    const totalDeductions = Object.values(deductions).reduce((s, v) => s + v, 0);
    y -= 4;
    page.drawLine({
      start: { x: margin + 15, y: y + 5 },
      end: { x: width - margin, y: y + 5 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    drawText("Total Deductions", margin + 15, y, helveticaBold, 10);
    drawText(`-$${totalDeductions.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, width - margin - 80, y, helveticaBold, 10);
    y -= 30;

    // ── Net Salary ──
    page.drawLine({
      start: { x: margin, y: y + 5 },
      end: { x: width - margin, y: y + 5 },
      thickness: 1.5,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 22;
    drawText("NET SALARY", margin, y, helveticaBold, 14);
    drawText(`$${salary.netSalary.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, width - margin - 100, y, helveticaBold, 14, rgb(0.92, 0.7, 0.05));
    y -= 40;

    // ── Footer ──
    page.drawLine({
      start: { x: margin, y: y + 10 },
      end: { x: width - margin, y: y + 10 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
    drawText(
      `Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} — WorkFrame HRMS`,
      margin,
      y - 8,
      helvetica,
      8,
      rgb(0.5, 0.5, 0.5)
    );

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(new Uint8Array(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="payslip-${empId}-${salary.effectiveDate.toISOString().slice(0, 7)}.pdf"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
