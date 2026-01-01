import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAnyAdmin } from "@/lib/requireRole";
import { canAccessClub } from "@/lib/permissions/clubAccess";

/**
 * Helper function to fetch and format a club with all related data
 * Used to ensure consistent club object structure across all endpoints
 */
async function fetchFormattedClub(clubId: string) {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      courts: {
        orderBy: { name: "asc" },
      },
      coaches: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
      gallery: {
        orderBy: { sortOrder: "asc" },
      },
      businessHours: {
        orderBy: { dayOfWeek: "asc" },
      },
    },
  });

  if (!club) {
    return null;
  }

  // Parse JSON fields
  return {
    ...club,
    logoData: club.logoData ? JSON.parse(club.logoData) : null,
    bannerData: club.bannerData ? JSON.parse(club.bannerData) : null,
  };
}

/**
 * PATCH /api/admin/clubs/[id]/metadata
 * Update club metadata
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAnyAdmin(request);

  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const resolvedParams = await params;
    const clubId = resolvedParams.id;

    // Check access permission for organization admins, club owners, and club admins
    if (authResult.adminType !== "root_admin") {
      const hasAccess = await canAccessClub(
        authResult.adminType,
        authResult.managedIds,
        clubId
      );
      if (!hasAccess) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const existingClub = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!existingClub) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    const body = await request.json();
    const { metadata } = body;

    if (metadata === undefined) {
      return NextResponse.json(
        { error: "metadata is required" },
        { status: 400 }
      );
    }

    await prisma.club.update({
      where: { id: clubId },
      data: {
        metadata: JSON.stringify(metadata),
      },
    });

    // Fetch and return the updated club object
    const updatedClub = await fetchFormattedClub(clubId);
    if (!updatedClub) {
      return NextResponse.json({ error: "Club not found after update" }, { status: 404 });
    }

    return NextResponse.json(updatedClub);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error updating club metadata:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
