import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "./auth";
import type { JwtPayload } from "./auth";

// ─── Error Class ─────────────────────────────────────────────────────────────

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

// ─── RBAC Guards ─────────────────────────────────────────────────────────────

/**
 * Requires a valid JWT. Returns the authenticated user payload.
 * Throws 401 if unauthenticated.
 *
 * Usage in any API route:
 *   export async function GET(request: NextRequest) {
 *     const user = withAuth(request);
 *     // user.id, user.email, user.role are now available
 *   }
 */
export function withAuth(request: NextRequest): JwtPayload {
  const user = getAuthUser(request);
  if (!user) {
    throw new HttpError(401, "Unauthorized: valid access token required");
  }
  return user;
}

/**
 * Requires a valid JWT with role === "ADMIN". Throws 401 or 403.
 */
export function withAdmin(request: NextRequest): JwtPayload {
  const user = getAuthUser(request);
  if (!user) {
    throw new HttpError(401, "Unauthorized: valid access token required");
  }
  if (user.role !== "ADMIN") {
    throw new HttpError(403, "Forbidden: admin access required");
  }
  return user;
}

/**
 * Requires that the authenticated user owns the resource, OR is an Admin.
 * This is the core field-level authorization guard for salary/document reads.
 *
 * @param request       The incoming request
 * @param ownerId       The employeeId / userId of the resource being accessed
 */
export function withOwnershipOrAdmin(
  request: NextRequest,
  ownerId: string
): JwtPayload {
  const user = getAuthUser(request);
  if (!user) {
    throw new HttpError(401, "Unauthorized: valid access token required");
  }
  if (user.role !== "ADMIN" && user.id !== ownerId) {
    throw new HttpError(
      403,
      "Forbidden: you can only access your own resources"
    );
  }
  return user;
}

// ─── Error Handler ───────────────────────────────────────────────────────────

/**
 * Catch-all error handler for API routes.
 * Returns a structured JSON error response.
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }
  console.error("Unhandled API error:", error);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
