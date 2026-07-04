import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withAdmin, handleApiError } from "@/lib/rbac";
import { leaveRequestSchema, leaveQuerySchema } from "@/lib/validation";

/**
 * POST /api/leave-requests
 * Employee applies for leave. Status defaults to PENDING.
 */
export async function POST(request: NextRequest) {
  try {
    const user = withAuth(request);
    const body = await request.json();
    const parsed = leaveRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { leaveType, startDate, endDate, remarks } = parsed.data;

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId: user.id,
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        remarks: remarks || null,
        status: "PENDING",
      },
      select: {
        id: true,
        leaveType: true,
        startDate: true,
        endDate: true,
        remarks: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(leaveRequest, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/leave-requests
 * Admin-only: view all leave requests with optional status/employee/department filters, search, and pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const user = withAdmin(request);
    const { searchParams } = new URL(request.url);
    const parsed = leaveQuerySchema.safeParse({
      status: searchParams.get("status") || undefined,
      employeeId: searchParams.get("employeeId") || undefined,
      department: searchParams.get("department") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page"),
      pageSize: searchParams.get("pageSize"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status, employeeId, department, search, page, pageSize } = parsed.data;

    const skip = (page - 1) * pageSize;

    const andConditions: any[] = [];
    if (status) {
      andConditions.push({ status });
    }
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
              employeeId: {
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

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    const [requests, total, allCount, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true,
          leaveType: true,
          startDate: true,
          endDate: true,
          remarks: true,
          status: true,
          reviewerComment: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              employeeId: true,
              profile: { select: { fullName: true, department: true } },
            },
          },
          reviewer: {
            select: {
              id: true,
              profile: { select: { fullName: true } },
            },
          },
        },
      }),
      prisma.leaveRequest.count({ where }),
      prisma.leaveRequest.count({}),
      prisma.leaveRequest.count({ where: { status: "PENDING" } }),
      prisma.leaveRequest.count({ where: { status: "APPROVED" } }),
      prisma.leaveRequest.count({ where: { status: "REJECTED" } }),
    ]);

    return NextResponse.json({
      requests,
      counts: {
        ALL: allCount,
        PENDING: pendingCount,
        APPROVED: approvedCount,
        REJECTED: rejectedCount,
      },
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
