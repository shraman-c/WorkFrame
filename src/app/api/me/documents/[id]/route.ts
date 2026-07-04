import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, handleApiError } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { unlink } from "fs/promises";
import path from "path";

/**
 * DELETE /api/me/documents/[id]
 * Delete a document owned by the authenticated user.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = withAuth(request);

    const document = await prisma.document.findUnique({
      where: { id: params.id },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.employeeId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete file from disk
    const filePath = path.join(process.cwd(), "public", document.fileUrl);
    try {
      await unlink(filePath);
    } catch {
      // File might not exist on disk — continue with DB delete
    }

    // Delete from database
    await prisma.document.delete({ where: { id: params.id } });

    // Audit log
    await logAudit(user.id, "DELETE_DOCUMENT", "Document", params.id);

    return NextResponse.json({ message: "Document deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
