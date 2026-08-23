import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, handleApiError } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const ALLOWED_TYPES = ["RESUME", "CERTIFICATE"];
const ALLOWED_EXTENSIONS = [".pdf"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * POST /api/me/documents/upload
 * Upload a resume or certificate PDF.
 * Expects multipart/form-data with fields: file (File), type (string).
 */
export async function POST(request: NextRequest) {
  try {
    const user = withAuth(request);

    const formData = await request.formData();
    // formData.get returns FormDataEntryValue | null; cast to File | null since
    // we only accept file uploads and validate the type below.
    const file = formData.get("file") as File | null;
    const docType = formData.get("type") as string | null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (!docType || !ALLOWED_TYPES.includes(docType)) {
      return NextResponse.json(
        { error: `Type must be one of: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate extension
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `Only ${ALLOWED_EXTENSIONS.join(", ")} files are allowed` },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File must be under 10MB" },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const safeName = path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${user.id}_${docType.toLowerCase()}_${timestamp}_${safeName}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    // Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Create database record
    const document = await prisma.document.create({
      data: {
        employeeId: user.id,
        fileUrl: `/uploads/${filename}`,
        type: docType,
      },
    });

    // Audit log
    await logAudit(user.id, "UPLOAD_DOCUMENT", "Document", document.id);

    return NextResponse.json({
      id: document.id,
      fileUrl: document.fileUrl,
      type: document.type,
      uploadedAt: document.uploadedAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
