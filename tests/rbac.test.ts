import { describe, it, expect, vi } from "vitest";
import { withAuth, withAdmin, withOwnershipOrAdmin, HttpError } from "../src/lib/rbac";
import { getAuthUser } from "../src/lib/auth";
import { NextRequest } from "next/server";

vi.mock("../src/lib/auth", () => ({
  getAuthUser: vi.fn(),
}));

describe("RBAC Guard Functions", () => {
  const mockRequest = new NextRequest("http://localhost/api/test");

  describe("withAuth", () => {
    it("should return user payload when token is valid", () => {
      const mockUser = { id: "emp1", email: "emp@test.com", role: "EMPLOYEE" as const };
      vi.mocked(getAuthUser).mockReturnValue(mockUser);

      const result = withAuth(mockRequest);
      expect(result).toEqual(mockUser);
    });

    it("should throw HttpError 401 when token is invalid/missing", () => {
      vi.mocked(getAuthUser).mockReturnValue(null);

      expect(() => withAuth(mockRequest)).toThrow(HttpError);
      try {
        withAuth(mockRequest);
      } catch (err: any) {
        expect(err.statusCode).toBe(401);
        expect(err.message).toContain("Unauthorized");
      }
    });
  });

  describe("withAdmin", () => {
    it("should return user payload when user is an ADMIN", () => {
      const mockUser = { id: "admin1", email: "admin@test.com", role: "ADMIN" as const };
      vi.mocked(getAuthUser).mockReturnValue(mockUser);

      const result = withAdmin(mockRequest);
      expect(result).toEqual(mockUser);
    });

    it("should throw HttpError 403 when user is an EMPLOYEE", () => {
      const mockUser = { id: "emp1", email: "emp@test.com", role: "EMPLOYEE" as const };
      vi.mocked(getAuthUser).mockReturnValue(mockUser);

      expect(() => withAdmin(mockRequest)).toThrow(HttpError);
      try {
        withAdmin(mockRequest);
      } catch (err: any) {
        expect(err.statusCode).toBe(403);
        expect(err.message).toContain("Forbidden: admin access required");
      }
    });
  });

  describe("withOwnershipOrAdmin", () => {
    it("should allow owner who is not admin", () => {
      const mockUser = { id: "emp1", email: "emp@test.com", role: "EMPLOYEE" as const };
      vi.mocked(getAuthUser).mockReturnValue(mockUser);

      const result = withOwnershipOrAdmin(mockRequest, "emp1");
      expect(result).toEqual(mockUser);
    });

    it("should allow admin who is not owner", () => {
      const mockUser = { id: "admin1", email: "admin@test.com", role: "ADMIN" as const };
      vi.mocked(getAuthUser).mockReturnValue(mockUser);

      const result = withOwnershipOrAdmin(mockRequest, "emp1");
      expect(result).toEqual(mockUser);
    });

    it("should throw 403 when user is neither owner nor admin", () => {
      const mockUser = { id: "emp2", email: "emp2@test.com", role: "EMPLOYEE" as const };
      vi.mocked(getAuthUser).mockReturnValue(mockUser);

      expect(() => withOwnershipOrAdmin(mockRequest, "emp1")).toThrow(HttpError);
      try {
        withOwnershipOrAdmin(mockRequest, "emp1");
      } catch (err: any) {
        expect(err.statusCode).toBe(403);
        expect(err.message).toContain("Forbidden");
      }
    });
  });
});
