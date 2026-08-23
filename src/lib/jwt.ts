import jwt from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRY = "15m";
const REFRESH_EXPIRY = "7d";

export interface JwtPayload {
  id: string;
  email: string;
  role: "EMPLOYEE" | "ADMIN";
  loginId?: string;
  companyId?: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
}

export function signRefreshToken(payload: JwtPayload): string {
  // Include a random jti to ensure each token is unique (prevents P2002 race conditions)
  return jwt.sign({ ...payload, jti: crypto.randomUUID() }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
}

export function verifyAccessToken(token: string): JwtPayload {
  // jwt.verify returns string | JwtPayload; we know ACCESS_SECRET only signs JwtPayload payloads
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  // jwt.verify returns string | JwtPayload; we know REFRESH_SECRET only signs JwtPayload payloads
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
}
