import { NextRequest } from "next/server";
import { verifyAccessToken } from "./jwt";
import type { JwtPayload } from "./jwt";

export type { JwtPayload };

/**
 * Extracts and verifies the JWT from the Authorization header.
 * Returns null if no token is present or the token is invalid.
 */
export function getAuthUser(request: NextRequest): JwtPayload | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  try {
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}
