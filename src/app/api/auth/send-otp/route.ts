import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendOtpSchema } from "@/lib/validation";
import { sendOtpEmail } from "@/lib/email";
import { isRateLimited } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/rbac";

/**
 * POST /api/auth/send-otp
 * Generates a 6-digit OTP, stores it hashed, and sends it via EmailJS.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = sendOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { userId } = parsed.data;

    // Rate limit: max 3 OTP requests per 5 minutes per user
    if (isRateLimited(`otp:${userId}`, 3, 300000)) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please try again later." },
        { status: 429 }
      );
    }

    // Verify user exists and hasn't verified yet
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        profile: { select: { fullName: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    // Invalidate any existing unused tokens for this user
    await prisma.verificationToken.updateMany({
      where: { userId, used: false },
      data: { used: true },
    });

    // Generate 6-digit OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otpCode, 10);

    // Store OTP with 10-minute expiry
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await prisma.verificationToken.create({
      data: {
        userId,
        otp: otpHash,
        expiresAt,
      },
    });

    // Send OTP email via EmailJS (always to the user's stored email, not client-provided)
    await sendOtpEmail({
      to: user.email,
      otpCode,
      employeeName: user.profile?.fullName || "User",
    });

    return NextResponse.json(
      { message: "OTP sent successfully. Check your email." },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
