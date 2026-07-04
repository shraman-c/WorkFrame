import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, handleApiError } from "@/lib/rbac";

/**
 * PATCH /api/notifications/read-all
 * Marks all unread notifications for the authenticated user as read.
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = withAuth(request);

    const { count } = await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ markedRead: count });
  } catch (error) {
    return handleApiError(error);
  }
}
