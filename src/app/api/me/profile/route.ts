import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, handleApiError } from "@/lib/rbac";
import { employeeProfileUpdateSchema } from "@/lib/validation";

/**
 * GET /api/me/profile
 * Returns the authenticated user's full profile, job details, documents, and role.
 */
export async function GET(request: NextRequest) {
  try {
    const user = withAuth(request);

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        loginId: true,
        email: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            fullName: true,
            phone: true,
            address: true,
            jobTitle: true,
            department: true,
            profilePictureUrl: true,
            about: true,
            interests: true,
          },
        },
        documents: {
          select: {
            id: true,
            fileUrl: true,
            type: true,
            uploadedAt: true,
          },
          orderBy: { uploadedAt: "desc" },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/me/profile
 * Employee can edit: fullName, phone, address, jobTitle, department, profilePictureUrl, about, interests.
 * Fields not in the schema are ignored (role, email, loginId, etc.).
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = withAuth(request);
    const body = await request.json();
    const parsed = employeeProfileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await prisma.employeeProfile.update({
      where: { userId: user.id },
      data: parsed.data,
      select: {
        fullName: true,
        phone: true,
        address: true,
        jobTitle: true,
        department: true,
        profilePictureUrl: true,
        about: true,
        interests: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
