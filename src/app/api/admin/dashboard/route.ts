import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAnyAdmin } from "@/lib/requireRole";
import type { PlatformStatistics } from "@/types/admin";

/**
 * Admin Dashboard Statistics API
 * 
 * Returns platform-wide statistics including:
 * - Total number of clubs
 * - Total number of registered users
 * - Total number of active bookings (pending or paid)
 * 
 * Access: Any admin (root, organization, or club admin)
 */

export async function GET(request: Request) {
  const authResult = await requireAnyAdmin(request);

  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    // Fetch all statistics in parallel for better performance
    const [totalClubs, totalUsers, activeBookings] = await Promise.all([
      prisma.club.count(),
      prisma.user.count(),
      prisma.booking.count({
        where: {
          status: {
            in: ["pending", "paid"],
          },
        },
      }),
    ]);

    const statistics: PlatformStatistics = {
      totalClubs,
      totalUsers,
      activeBookings,
    };

    return NextResponse.json(statistics);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching dashboard statistics:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
