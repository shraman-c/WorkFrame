import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyOtpSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/rbac";

/**
 * POST /api/auth/verify-otp
 * Verifies a 6-digit OTP and marks the user's email as verified.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { userId, otp } = parsed.data;

    // Find the latest unused OTP token for this user
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        userId,
        used: false,
        otp: { not: null },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "No OTP found. Please request a new one." },
        { status: 400 }
      );
    }

    // Reject if expired
    if (new Date() > verificationToken.expiresAt) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Verify the OTP
    const otpValid = await bcrypt.compare(otp, verificationToken.otp!);
    if (!otpValid) {
      return NextResponse.json(
        { error: "Invalid OTP. Please try again." },
        { status: 400 }
      );
    }

    // Mark token used + verify email in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.verificationToken.update({
        where: { id: verificationToken.id },
        data: { used: true },
      });

      await tx.user.update({
        where: { id: userId },
        data: { emailVerified: true },
      });
    });

    return NextResponse.json(
      { message: "Email verified successfully. You can now sign in." },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
