import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdmin, handleApiError } from "@/lib/rbac";
import { getCached, setCached } from "@/lib/cache";

interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  leaveToday: number;
  pendingLeaves: number;
}

export async function GET(request: NextRequest) {
  try {
    withAdmin(request);

    const cacheKey = "dashboard:admin:stats";
    let stats = getCached<DashboardStats>(cacheKey);

    if (stats === null) {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const [totalEmployees, presentToday, leaveToday, pendingLeaves] = await Promise.all([
        prisma.user.count({ where: { role: "EMPLOYEE" } }),
        prisma.attendanceRecord.count({
          where: {
            date: today,
            status: "PRESENT",
          },
        }),
        prisma.attendanceRecord.count({
          where: {
            date: today,
            status: "LEAVE",
          },
        }),
        prisma.leaveRequest.count({
          where: {
            status: "PENDING",
          },
        }),
      ]);

      stats = {
        totalEmployees,
        presentToday,
        leaveToday,
        pendingLeaves,
      };

      setCached(cacheKey, stats, 15000); // 15 seconds cache TTL
    }

    return NextResponse.json(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
