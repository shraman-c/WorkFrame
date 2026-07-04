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
 * Admin-only: view all leave requests with optional status/employee filters.
 * Also used by employees via /api/leave-requests/me (separate route).
 */
export async function GET(request: NextRequest) {
  try {
    const user = withAdmin(request);
    const { searchParams } = new URL(request.url);
    const parsed = leaveQuerySchema.safeParse({
      status: searchParams.get("status") || undefined,
      employeeId: searchParams.get("employeeId") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    const { status, employeeId } = parsed.data;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;

    const requests = await prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
            profile: { select: { fullName: true } },
          },
        },
        reviewer: {
          select: {
            id: true,
            profile: { select: { fullName: true } },
          },
        },
      },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    return handleApiError(error);
  }
}
