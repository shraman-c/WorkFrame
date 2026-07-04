import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, handleApiError } from "@/lib/rbac";
import { notificationQuerySchema } from "@/lib/validation";
import { getCached, setCached } from "@/lib/cache";

/**
 * GET /api/notifications/me?page=1&pageSize=20
 * Returns paginated notifications for the authenticated user, newest first.
 * Also returns unreadCount for the bell badge.
 */
export async function GET(request: NextRequest) {
  try {
    const user = withAuth(request);
    const { searchParams } = new URL(request.url);

    const parsed = notificationQuerySchema.safeParse({
      page: searchParams.get("page"),
      pageSize: searchParams.get("pageSize"),
    });

    const { page, pageSize } = parsed.success ? parsed.data : { page: 1, pageSize: 20 };

    const skip = (page - 1) * pageSize;

    const cacheKey = `notifications:unread:${user.id}`;
    let unreadCount = getCached<number>(cacheKey);

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true,
          type: true,
          message: true,
          isRead: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({ where: { userId: user.id } }),
    ]);

    if (unreadCount === null) {
      unreadCount = await prisma.notification.count({ where: { userId: user.id, isRead: false } });
      setCached(cacheKey, unreadCount, 15000); // Cache unread count for 15 seconds
    }

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
