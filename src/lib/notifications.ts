import { prisma } from "./prisma";
import type { NotificationType } from "@prisma/client";
import { invalidateCache } from "./cache";

/**
 * Creates an in-app notification for a user.
 * Errors are logged but never thrown — notifications should never block the main operation.
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  message: string
): Promise<void> {
  try {
    await prisma.notification.create({
      data: { userId, type, message },
    });
    // Invalidate cached unread notifications count
    invalidateCache(`notifications:unread:${userId}`);
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}
