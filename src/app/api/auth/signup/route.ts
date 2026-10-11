import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validation";
import { isRateLimited } from "@/lib/rate-limit";

const SALT_ROUNDS = 12;

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    if (isRateLimited(`signup:${ip}`, 5, 60000)) {
      return NextResponse.json(
        { error: "Too many sign-up attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { employeeId, email, password } = parsed.data;
    // Role is always EMPLOYEE at signup. Admin accounts are created by existing admins.
    const role = "EMPLOYEE" as const;

    // Check for existing user by email or employeeId
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { employeeId }],
      },
      select: { email: true, employeeId: true },
    });

    if (existingUser) {
      const field =
        existingUser.email === email ? "email" : "employee ID";
      return NextResponse.json(
        { error: `A user with this ${field} already exists` },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user with empty profile in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          employeeId,
          email,
          passwordHash,
          role,
        },
      });

      await tx.employeeProfile.create({
        data: {
          userId: newUser.id,
          fullName: "",
        },
      });

      return newUser;
    });

    // Generate single-use verification token (24h expiry)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // TODO: Replace with real email service (SendGrid / SES / Postmark)
    // For now, log the token so devs can verify manually
    console.log(
      `\n[WorkFrame] Email verification token for ${email}:\n${token}\n`
    );

    return NextResponse.json(
      {
        message:
          "Account created successfully. Please check your email to verify your account.",
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
