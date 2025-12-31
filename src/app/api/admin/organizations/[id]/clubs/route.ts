import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrganizationAdmin } from "@/lib/requireRole";

/**
 * GET /api/admin/organizations/[id]/clubs
 * Returns clubs for a given organization with minimal statistics.
 * 
 * Statistics per club:
 * - Number of courts
 * - Number of active upcoming bookings (pending, paid, reserved, confirmed, start >= now)
 * - Number of past bookings (start < now)
 * 
 * Allowed: isRoot OR ORGANIZATION_ADMIN of this org
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authResult = await requireOrganizationAdmin(id);
    if (!authResult.authorized) {
      return authResult.response;
    }

    // Parse query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    // Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Fetch clubs for the organization
    const [clubs, totalCount] = await Promise.all([
      prisma.club.findMany({
        where: { organizationId: id },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              courts: true,
            },
          },
        },
      }),
      prisma.club.count({
        where: { organizationId: id },
      }),
    ]);

    // Fetch booking statistics for each club
    const now = new Date();
    const clubsWithStats = await Promise.all(
      clubs.map(async (club) => {
        const [activeUpcomingBookings, pastBookings] = await Promise.all([
          // Active upcoming bookings
          prisma.booking.count({
            where: {
              court: {
                clubId: club.id,
              },
              status: { in: ["pending", "paid", "reserved", "confirmed"] },
              start: { gte: now },
            },
          }),
          // Past bookings
          prisma.booking.count({
            where: {
              court: {
                clubId: club.id,
              },
              start: { lt: now },
            },
          }),
        ]);

        return {
          id: club.id,
          name: club.name,
          slug: club.slug,
          city: club.city,
          isPublic: club.isPublic,
          createdAt: club.createdAt,
          statistics: {
            courtCount: club._count.courts,
            activeUpcomingBookings,
            pastBookings,
          },
        };
      })
    );

    return NextResponse.json({
      clubs: clubsWithStats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching organization clubs:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
