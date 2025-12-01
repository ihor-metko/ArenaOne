import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Public endpoint - no authentication required
export async function GET(request: Request) {
  try {
    // Parse query parameters for search
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim() || "";
    const indoor = url.searchParams.get("indoor");

    // Build where clause for filtering
    const whereClause: Prisma.ClubWhereInput = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch clubs with optional filtering
    const clubs = await prisma.club.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        location: true,
        contactInfo: true,
        openingHours: true,
        logo: true,
        createdAt: true,
        courts: {
          select: {
            id: true,
            indoor: true,
          },
        },
      },
    });

    // Process clubs to add indoor/outdoor counts
    const clubsWithCounts = clubs.map((club) => {
      const indoorCount = club.courts.filter((c) => c.indoor).length;
      const outdoorCount = club.courts.filter((c) => !c.indoor).length;

      // Filter by indoor param if provided
      if (indoor === "true" && indoorCount === 0) {
        return null;
      }

      return {
        id: club.id,
        name: club.name,
        location: club.location,
        contactInfo: club.contactInfo,
        openingHours: club.openingHours,
        logo: club.logo,
        createdAt: club.createdAt,
        indoorCount,
        outdoorCount,
      };
    }).filter((club): club is NonNullable<typeof club> => club !== null);

    return NextResponse.json(clubsWithCounts);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching clubs:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
