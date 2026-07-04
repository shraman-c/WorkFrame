import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signinSchema } from "@/lib/validation";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { isRateLimited } from "@/lib/rate-limit";

const REFRESH_TOKEN_DAYS = 7;

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    if (isRateLimited(`signin:${ip}`, 5, 60000)) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = signinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Require email verification before first login
    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error:
            "Please verify your email before signing in. Check your inbox for the verification link.",
        },
        { status: 403 }
      );
    }

    // Build JWT payload
    const jwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role as "EMPLOYEE" | "ADMIN",
    };

    // Issue tokens
    const accessToken = signAccessToken(jwtPayload);
    const refreshToken = signRefreshToken(jwtPayload);

    // Revoke all existing refresh tokens for this user, then persist the new one
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

    await prisma.$transaction(async (tx) => {
      await tx.refreshToken.deleteMany({ where: { userId: user.id } });
      await tx.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt,
        },
      });
    });

    // Build response: access token in body, refresh token in httpOnly cookie
    const response = NextResponse.json(
      {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
        },
      },
      { status: 200 }
    );

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Signin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
