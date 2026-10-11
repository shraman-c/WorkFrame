import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../src/app/api/payroll/me/payslip/route";
import { prisma } from "../src/lib/prisma";
import { withAuth, withAdmin } from "../src/lib/rbac";
import { PDFDocument } from "pdf-lib";
import { NextRequest } from "next/server";

vi.mock("../src/lib/prisma", () => ({
  prisma: {
    salaryStructure: {
      findFirst: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock("../src/lib/rbac", () => ({
  withAuth: vi.fn(),
  withAdmin: vi.fn(),
  handleApiError: vi.fn((err) => {
    throw err;
  }),
}));

vi.mock("../src/lib/rate-limit", () => ({
  isRateLimited: vi.fn(() => false),
}));

vi.mock("../src/lib/audit", () => ({
  logAudit: vi.fn(),
}));

describe("Payslip PDF Generation Field Mapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should retrieve correct salary structure and invoke PDF drawing functions", async () => {
    const mockUser = { id: "emp-123", email: "employee@test.com", role: "EMPLOYEE" as const };
    vi.mocked(withAuth).mockReturnValue(mockUser);

    const mockSalary = {
      id: "salary-456",
      baseSalary: 5000,
      allowances: { hra: 1000, medical: 500 },
      deductions: { tax: 800, pf: 400 },
      netSalary: 5300,
      effectiveDate: new Date("2026-06-01"),
      user: {
        id: "emp-123",
        employeeId: "EMP-999",
        email: "employee@test.com",
        profile: {
          fullName: "Spandan Dhar",
          jobTitle: "Software Developer",
          department: "Engineering",
        },
      },
    };
    vi.mocked(prisma.salaryStructure.findFirst).mockResolvedValue(mockSalary as any);

    // Spy on PDFDocument methods using pdf-lib
    const drawTextSpy = vi.fn();
    const drawLineSpy = vi.fn();
    const addPageSpy = vi.fn(() => ({
      getSize: () => ({ width: 595, height: 842 }),
      drawText: drawTextSpy,
      drawLine: drawLineSpy,
    }));

    vi.spyOn(PDFDocument, "create").mockResolvedValue({
      embedFont: vi.fn().mockResolvedValue({}),
      addPage: addPageSpy,
      save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    } as any);

    const req = new NextRequest("http://localhost/api/payroll/me/payslip?salaryId=salary-456");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toContain("payslip-EMP-999-2026-06.pdf");

    // Verify correct employee details are drawn
    expect(drawTextSpy).toHaveBeenCalledWith("Spandan Dhar", expect.any(Object));
    expect(drawTextSpy).toHaveBeenCalledWith("EMP-999", expect.any(Object));
    expect(drawTextSpy).toHaveBeenCalledWith("Engineering", expect.any(Object));
    
    // Verify pay period (formatted to June 2026)
    expect(drawTextSpy).toHaveBeenCalledWith("June 2026", expect.any(Object));

    // Verify salary numbers
    expect(drawTextSpy).toHaveBeenCalledWith("$5,000.00", expect.any(Object));
    expect(drawTextSpy).toHaveBeenCalledWith("$5,300.00", expect.any(Object));
  });
});
