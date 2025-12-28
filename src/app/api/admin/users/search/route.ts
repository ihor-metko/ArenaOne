import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAnyAdmin } from "@/lib/requireRole";

/**
 * GET /api/admin/users/search
 * Search for users by name, email, username, or phone
 * 
 * Required permissions:
 * - ROOT_ADMIN, ORGANIZATION_ADMIN, or CLUB_ADMIN
 * 
 * Query params:
 * - q: string (required) - Search query (searches name and email)
 */
export async function GET(request: Request) {
  const authResult = await requireAnyAdmin(request);

  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { error: "Search query parameter 'q' is required" },
        { status: 400 }
      );
    }

    // Return empty results for very short queries to avoid performance issues
    if (query.trim().length < 2) {
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    // Search for users with name or email containing the query (case-insensitive)
    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            email: {
              contains: query.toLowerCase(),
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 10, // Limit results to 10
      orderBy: [
        // Prioritize exact email matches
        { email: "asc" },
      ],
    });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error searching users:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
