import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyEmailSchema } from "@/lib/validation";
import { sendEmail, welcomeEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifyEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { token } = parsed.data;

    // Look up the verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      );
    }

    // Reject if already used
    if (verificationToken.used) {
      return NextResponse.json(
        { error: "Verification token has already been used" },
        { status: 400 }
      );
    }

    // Reject if expired
    if (new Date() > verificationToken.expiresAt) {
      return NextResponse.json(
        { error: "Verification token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Mark token used + verify email in a single transaction
    await prisma.$transaction(async (tx) => {
      await tx.verificationToken.update({
        where: { id: verificationToken.id },
        data: { used: true },
      });

      await tx.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: true },
      });
    });

    // Send welcome email
    const user = await prisma.user.findUnique({
      where: { id: verificationToken.userId },
      select: { email: true, profile: { select: { fullName: true } } },
    });
    if (user) {
      const emailTemplate = welcomeEmail({
        employeeName: user.profile?.fullName || "Employee",
      });
      await sendEmail({ to: user.email, ...emailTemplate });
    }

    return NextResponse.json(
      { message: "Email verified successfully. You can now sign in." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
