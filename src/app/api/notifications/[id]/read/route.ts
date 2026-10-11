import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, handleApiError } from "@/lib/rbac";
import { invalidateCache } from "@/lib/cache";

interface RouteParams {
  params: { id: string };
}

/**
 * PATCH /api/notifications/:id/read
 * Marks a single notification as read. Only the owner can mark their own notifications.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = withAuth(request);
    const { id } = params;

    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { id: true, userId: true, isRead: true },
    });

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    if (notification.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (notification.isRead) {
      return NextResponse.json({ message: "Already read" });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
      select: { id: true, isRead: true, userId: true },
    });

    invalidateCache(`notifications:unread:${updated.userId}`);

    return NextResponse.json({ id: updated.id, isRead: updated.isRead });
  } catch (error) {
    return handleApiError(error);
  }
}
