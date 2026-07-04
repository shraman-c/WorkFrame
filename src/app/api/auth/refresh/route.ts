import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/jwt";

const REFRESH_TOKEN_DAYS = 7;

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token required" }, { status: 401 });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
    }

    // Find the refresh token in the database
    const dbToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            employeeId: true,
          },
        },
      },
    });

    if (!dbToken || dbToken.expiresAt < new Date()) {
      // If expired or not found, clean up if dbToken exists
      if (dbToken) {
        await prisma.refreshToken.delete({ where: { id: dbToken.id } }).catch(() => {});
      }
      return NextResponse.json({ error: "Refresh token revoked or expired" }, { status: 401 });
    }

    const user = dbToken.user;

    // Build new JWT payload
    const jwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role as "EMPLOYEE" | "ADMIN",
    };

    // Issue new tokens (rotation)
    const newAccessToken = signAccessToken(jwtPayload);
    const newRefreshToken = signRefreshToken(jwtPayload);

    // Save new token to DB, revoking the old one
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

    await prisma.$transaction(async (tx) => {
      await tx.refreshToken.delete({ where: { id: dbToken.id } });
      await tx.refreshToken.create({
        data: {
          userId: user.id,
          token: newRefreshToken,
          expiresAt,
        },
      });
    });

    // Build response: access token in body, refresh token in httpOnly cookie
    const response = NextResponse.json(
      {
        accessToken: newAccessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
        },
      },
      { status: 200 }
    );

    response.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
