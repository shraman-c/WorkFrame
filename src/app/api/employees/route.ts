import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdmin, handleApiError } from "@/lib/rbac";
import type { Prisma } from "@prisma/client";

/**
 * GET /api/employees
 * Admin-only: list all employees with their profiles.
 * Supports search (fullName or employeeId), department filter, and pagination.
 */
export async function GET(request: NextRequest) {
  try {
    withAdmin(request);
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || undefined;
    const department = searchParams.get("department") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const skip = (page - 1) * pageSize;

    const where: Prisma.UserWhereInput = {
      role: "EMPLOYEE",
    };

    const andConditions: Prisma.UserWhereInput[] = [];

    if (department) {
      andConditions.push({
        profile: {
          department: {
            equals: department,
            mode: "insensitive",
          },
        },
      });
    }

    if (search) {
      andConditions.push({
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
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true,
          loginId: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          profile: {
            select: {
              fullName: true,
              phone: true,
              address: true,
              jobTitle: true,
              department: true,
              profilePictureUrl: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
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
