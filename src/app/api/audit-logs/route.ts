import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdmin, handleApiError } from "@/lib/rbac";
import { auditLogQuerySchema } from "@/lib/validation";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    withAdmin(request);
    const { searchParams } = new URL(request.url);

    const parsed = auditLogQuerySchema.safeParse({
      page: searchParams.get("page"),
      pageSize: searchParams.get("pageSize"),
      actorId: searchParams.get("actorId") || undefined,
      targetEntity: searchParams.get("targetEntity") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      search: searchParams.get("search") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { page, pageSize, actorId, targetEntity, startDate, endDate, search } = parsed.data;
    const skip = (page - 1) * pageSize;

    const andConditions: Prisma.AuditLogWhereInput[] = [];

    if (actorId) {
      andConditions.push({ actorId });
    }
    if (targetEntity) {
      andConditions.push({ targetEntity });
    }
    if (search) {
      andConditions.push({
        user: {
          OR: [
            { loginId: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { profile: { fullName: { contains: search, mode: "insensitive" } } },
          ],
        },
      });
    }
    if (startDate || endDate) {
      const timeFilter: Prisma.DateTimeFilter = {};
      if (startDate) timeFilter.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        timeFilter.lte = end;
      }
      andConditions.push({ timestamp: timeFilter });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              loginId: true,
              email: true,
              profile: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      auditLogs,
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
