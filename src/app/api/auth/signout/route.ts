import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { handleApiError } from "@/lib/rbac";

/**
 * POST /api/auth/signout
 * Revokes the current refresh token and clears the cookie.
 */
export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);

    if (user) {
      // Delete all refresh tokens for this user
      await prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      });
    }

    const response = NextResponse.json({ message: "Signed out successfully" });

    // Clear the refresh token cookie
    response.cookies.set("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
