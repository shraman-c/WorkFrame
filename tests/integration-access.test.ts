import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getEmployees } from "../src/app/api/employees/route";
import { GET as getAttendance } from "../src/app/api/attendance/route";
import { GET as getLeaveRequests } from "../src/app/api/leave-requests/route";
import { withAdmin } from "../src/lib/rbac";
import { NextRequest } from "next/server";

vi.mock("../src/lib/rbac", () => ({
  withAdmin: vi.fn(),
  handleApiError: vi.fn((err) => {
    return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode || 500 });
  }),
  HttpError: class HttpError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string) {
      super(message);
      this.statusCode = statusCode;
    }
  },
}));

describe("Employee Data Access Restrictions (Integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should deny normal EMPLOYEE accessing the employee list endpoint", async () => {
    vi.mocked(withAdmin).mockImplementation(() => {
      const err = new Error("Forbidden: admin access required");
      (err as any).statusCode = 403;
      throw err;
    });

    const req = new NextRequest("http://localhost/api/employees");
    const res = await getEmployees(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("Forbidden");
  });

  it("should deny normal EMPLOYEE accessing the attendance list endpoint", async () => {
    vi.mocked(withAdmin).mockImplementation(() => {
      const err = new Error("Forbidden: admin access required");
      (err as any).statusCode = 403;
      throw err;
    });

    const req = new NextRequest("http://localhost/api/attendance");
    const res = await getAttendance(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("Forbidden");
  });

  it("should deny normal EMPLOYEE accessing the leave requests list endpoint", async () => {
    vi.mocked(withAdmin).mockImplementation(() => {
      const err = new Error("Forbidden: admin access required");
      (err as any).statusCode = 403;
      throw err;
    });

    const req = new NextRequest("http://localhost/api/leave-requests");
    const res = await getLeaveRequests(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("Forbidden");
  });
});
