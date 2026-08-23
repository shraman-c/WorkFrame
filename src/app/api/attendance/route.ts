import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdmin, handleApiError } from "@/lib/rbac";
import type { Prisma } from "@prisma/client";

/**
 * GET /api/attendance?employeeId=xxx&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Admin-only: view attendance for a specific employee or all employees.
 * Supports search, department filter, and pagination.
 */
export async function GET(request: NextRequest) {
  try {
    withAdmin(request);
    const { searchParams } = new URL(request.url);

    const employeeId = searchParams.get("employeeId");
    const search = searchParams.get("search") || undefined;
    const department = searchParams.get("department") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const skip = (page - 1) * pageSize;

    // Default: last 7 days
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : new Date();

    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : new Date(endDate);
    if (!searchParams.get("startDate")) {
      startDate.setDate(startDate.getDate() - 6);
    }

    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 999);

    const andConditions: Prisma.AttendanceRecordWhereInput[] = [
      { date: { gte: startDate, lte: endDate } },
    ];

    if (employeeId) {
      andConditions.push({ employeeId });
    }

    if (department) {
      andConditions.push({
        user: {
          profile: {
            department: {
              equals: department,
              mode: "insensitive",
            },
          },
        },
      });
    }

    if (search) {
      andConditions.push({
        user: {
          OR: [
            {
              loginId: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              profile: {
                fullName: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          ],
        },
      });
    }

    const where = { AND: andConditions };

    const [records, total] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where,
        orderBy: [{ date: "desc" }, { employeeId: "asc" }],
        skip,
        take: pageSize,
        select: {
          id: true,
          employeeId: true,
          date: true,
          checkIn: true,
          checkOut: true,
          status: true,
          user: {
            select: {
              loginId: true,
              profile: {
                select: {
                  fullName: true,
                  department: true,
                },
              },
            },
          },
        },
      }),
      prisma.attendanceRecord.count({ where }),
    ]);

    return NextResponse.json({
      records,
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
