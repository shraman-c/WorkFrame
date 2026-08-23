import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validation";
import { isRateLimited } from "@/lib/rate-limit";
import { deriveCompanyInitials, buildLoginId, parseFullName } from "@/lib/login-id";
import { handleApiError } from "@/lib/rbac";

const SALT_ROUNDS = 12;

/**
 * POST /api/auth/signup
 * Creates a COMPANY record + its first ADMIN user.
 * This is NOT an employee registration — only company admins register here.
 */
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

    const { companyName, name, email, phone, password } = parsed.data;

    // Check for existing user by email
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { email: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Derive company initials
    const companyInitials = deriveCompanyInitials(companyName);
    if (companyInitials.length === 0) {
      return NextResponse.json(
        { error: "Could not derive company initials from the company name" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const currentYear = new Date().getFullYear();
    const [firstName, lastName] = parseFullName(name);

    // Create company, join sequence, user, and profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the company
      const company = await tx.company.create({
        data: {
          name: companyName,
          initials: companyInitials,
        },
      });

      // 2. Initialize the join sequence for this year (lastSerial starts at 0)
      const joinSeq = await tx.companyJoinSequence.create({
        data: {
          companyId: company.id,
          year: currentYear,
          lastSerial: 0,
        },
      });

      // 3. Atomically increment the serial counter and use the result
      const updatedSeq = await tx.companyJoinSequence.update({
        where: { id: joinSeq.id },
        data: { lastSerial: { increment: 1 } },
      });
      const serial = updatedSeq.lastSerial;

      // 4. Build the Login ID using the atomically generated serial
      const loginId = buildLoginId(companyInitials, firstName, lastName, currentYear, serial);

      // 4. Create the first admin user
      const user = await tx.user.create({
        data: {
          loginId,
          email,
          passwordHash,
          role: "ADMIN",
          companyId: company.id,
          mustChangePassword: false,
          emailVerified: false,
        },
      });

      // 5. Create employee profile
      await tx.employeeProfile.create({
        data: {
          userId: user.id,
          fullName: name,
          phone: phone || null,
        },
      });

      return { company, user, loginId };
    });

    return NextResponse.json(
      {
        message:
          `Account created successfully. Your Login ID is: ${result.loginId}. Please verify your email with the OTP sent.`,
        userId: result.user.id,
        loginId: result.loginId,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
