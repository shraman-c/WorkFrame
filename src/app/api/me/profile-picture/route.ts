import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, handleApiError } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { writeFile, unlink } from "fs/promises";
import path from "path";

/**
 * POST /api/me/profile-picture
 * Upload a profile picture. Saves to public/uploads/ and updates EmployeeProfile.profilePictureUrl.
 */
export async function POST(request: NextRequest) {
  try {
    const user = withAuth(request);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WebP, and GIF images are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be under 5MB" },
        { status: 400 }
      );
    }

    // Sanitize filename
    const ext = path.extname(file.name) || ".jpg";
    const filename = `${user.id}_profile${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const fileUrl = `/uploads/${filename}`;

    // Update profile
    const updated = await prisma.employeeProfile.update({
      where: { userId: user.id },
      data: { profilePictureUrl: fileUrl },
      select: { profilePictureUrl: true },
    });

    // Audit log
    await logAudit(user.id, "UPLOAD_PROFILE_PICTURE", "EmployeeProfile", user.id);

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
