import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClubAccess, requireRootAdmin } from "@/lib/requireRole";
import { auditLog, AuditAction, TargetType } from "@/lib/auditLog";
// TEMPORARY MOCK MODE — REMOVE WHEN DB IS FIXED
import { isMockMode, getMockClubs, getMockCourts, getMockCoaches, getMockBusinessHours, getMockGalleryImages, getMockUsers } from "@/services/mockDb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const clubId = resolvedParams.id;

    // Check access using the centralized helper
    const authResult = await requireClubAccess(clubId);

    if (!authResult.authorized) {
      // Log unauthorized access attempt
      const { searchParams } = new URL(request.url);
      await auditLog(
        authResult.userId || "unknown",
        AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
        TargetType.CLUB,
        clubId,
        {
          attemptedPath: `/api/admin/clubs/${clubId}`,
          method: "GET",
          queryParams: Object.fromEntries(searchParams.entries()),
        }
      );
      return authResult.response;
    }

    // TEMPORARY MOCK MODE — REMOVE WHEN DB IS FIXED
    if (isMockMode()) {
      const mockClubs = getMockClubs();
      const mockCourts = getMockCourts();
      const mockCoaches = getMockCoaches();
      const mockBusinessHours = getMockBusinessHours();
      const mockGalleryImages = getMockGalleryImages();
      const mockUsers = getMockUsers();
      
      const club = mockClubs.find((c) => c.id === clubId);
      
      if (!club) {
        return NextResponse.json({ error: "Club not found" }, { status: 404 });
      }
      
      const courts = mockCourts
        .filter((c) => c.clubId === clubId)
        .sort((a, b) => a.name.localeCompare(b.name));
      
      const clubCoaches = mockCoaches
        .filter((c) => c.clubId === clubId)
        .map((coach) => {
          const user = mockUsers.find((u) => u.id === coach.userId);
          return {
            ...coach,
            user: user ? {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
            } : null,
          };
        });
      
      const clubBusinessHours = mockBusinessHours
        .filter((bh) => bh.clubId === clubId)
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
      
      const clubGallery = mockGalleryImages
        .filter((img) => img.clubId === clubId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      
      return NextResponse.json({
        ...club,
        courts,
        coaches: clubCoaches,
        businessHours: clubBusinessHours,
        specialHours: [],
        gallery: clubGallery,
      });
    }

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
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
        specialHours: {
          orderBy: { date: "asc" },
        },
      },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    return NextResponse.json(club);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching club:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const clubId = resolvedParams.id;

    // Check access - club admins cannot edit clubs (only root and org admins)
    const authResult = await requireClubAccess(clubId, { allowClubAdmin: false });

    if (!authResult.authorized) {
      // Log unauthorized access attempt
      await auditLog(
        authResult.userId || "unknown",
        AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
        TargetType.CLUB,
        clubId,
        {
          attemptedPath: `/api/admin/clubs/${clubId}`,
          method: "PUT",
        }
      );
      return authResult.response;
    }

    const existingClub = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!existingClub) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, location, contactInfo, openingHours, logo } = body;

    if (!name || !location) {
      return NextResponse.json(
        { error: "Name and location are required" },
        { status: 400 }
      );
    }

    const updatedClub = await prisma.club.update({
      where: { id: clubId },
      data: {
        name,
        location,
        contactInfo: contactInfo || null,
        openingHours: openingHours || null,
        logo: logo || null,
      },
    });

    return NextResponse.json(updatedClub);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error updating club:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRootAdmin(request);

  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const resolvedParams = await params;
    const clubId = resolvedParams.id;

    const existingClub = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!existingClub) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    await prisma.club.delete({
      where: { id: clubId },
    });

    return NextResponse.json({ message: "Club deleted successfully" });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error deleting club:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
