import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRootAdmin } from "@/lib/requireRole";

/**
 * GET /api/admin/publication-requests
 * 
 * List all club publication requests. Only accessible by root admins.
 */
export async function GET(request: Request) {
  const authResult = await requireRootAdmin(request);

  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | null;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = Math.min(parseInt(searchParams.get("perPage") || "20", 10), 100);
    const skip = (page - 1) * perPage;

    // Build where clause
    const where: {
      status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
    } = {};
    if (status) {
      where.status = status;
    }

    // Fetch requests with pagination
    const [requests, total] = await Promise.all([
      prisma.clubPublicationRequest.findMany({
        where,
        include: {
          club: {
            select: {
              id: true,
              name: true,
              slug: true,
              organizationId: true,
              organization: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          requestedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: perPage,
      }),
      prisma.clubPublicationRequest.count({ where }),
    ]);

    return NextResponse.json({
      requests,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching publication requests:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
