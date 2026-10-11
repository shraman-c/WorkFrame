import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH } from "../src/app/api/leave-requests/[id]/decision/route";
import { prisma } from "../src/lib/prisma";
import { withAdmin } from "../src/lib/rbac";
import { NextRequest } from "next/server";

vi.mock("../src/lib/prisma", () => ({
  prisma: {
    leaveRequest: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
  },
}));

vi.mock("../src/lib/rbac", () => ({
  withAdmin: vi.fn(),
  handleApiError: vi.fn((err) => {
    throw err;
  }),
}));

vi.mock("../src/lib/email", () => ({
  sendEmail: vi.fn(),
  leaveDecisionEmail: vi.fn(() => ({ subject: "Test", html: "Test" })),
}));

describe("Leave Status Transitions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should transition successfully if request is PENDING", async () => {
    const adminUser = { id: "admin-1", email: "admin@test.com", role: "ADMIN" as const };
    vi.mocked(withAdmin).mockReturnValue(adminUser);

    const mockRequestObj = {
      id: "leave-1",
      status: "PENDING",
      employeeId: "emp-1",
      leaveType: "PAID",
    };
    vi.mocked(prisma.leaveRequest.findUnique).mockResolvedValue(mockRequestObj as any);

    const updatedRequestObj = {
      id: "leave-1",
      leaveType: "PAID",
      startDate: new Date("2026-07-10"),
      endDate: new Date("2026-07-15"),
      remarks: "Vacation",
      status: "APPROVED",
      reviewerComment: "Approved",
      reviewedBy: "admin-1",
      createdAt: new Date(),
    };
    vi.mocked(prisma.leaveRequest.update).mockResolvedValue(updatedRequestObj as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: "emp@test.com",
      profile: { fullName: "Test Employee" },
    } as any);

    const req = new NextRequest("http://localhost/api/leave-requests/leave-1/decision", {
      method: "PATCH",
      body: JSON.stringify({ status: "APPROVED", reviewerComment: "Approved" }),
    });

    const res = await PATCH(req, { params: { id: "leave-1" } });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("APPROVED");
    expect(prisma.leaveRequest.update).toHaveBeenCalled();
  });

  it("should fail with status 409 if request is already APPROVED", async () => {
    const adminUser = { id: "admin-1", email: "admin@test.com", role: "ADMIN" as const };
    vi.mocked(withAdmin).mockReturnValue(adminUser);

    const mockRequestObj = {
      id: "leave-1",
      status: "APPROVED",
      employeeId: "emp-1",
      leaveType: "PAID",
    };
    vi.mocked(prisma.leaveRequest.findUnique).mockResolvedValue(mockRequestObj as any);

    const req = new NextRequest("http://localhost/api/leave-requests/leave-1/decision", {
      method: "PATCH",
      body: JSON.stringify({ status: "REJECTED", reviewerComment: "Cannot reject approved" }),
    });

    const res = await PATCH(req, { params: { id: "leave-1" } });
    expect(res.status).toBe(409);

    const body = await res.json();
    expect(body.error).toContain("already been approved");
    expect(prisma.leaveRequest.update).not.toHaveBeenCalled();
  });
});
