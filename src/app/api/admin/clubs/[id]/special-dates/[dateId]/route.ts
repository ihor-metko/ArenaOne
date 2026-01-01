import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAnyAdmin } from "@/lib/requireRole";
import { canAccessClub } from "@/lib/permissions/clubAccess";

/**
 * GET /api/admin/clubs/[id]/special-dates/[dateId]
 * Get a specific special date
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; dateId: string }> }
) {
  const authResult = await requireAnyAdmin(request);

  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const resolvedParams = await params;
    const { id: clubId, dateId } = resolvedParams;

    // Check access permission
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

    const specialDate = await prisma.clubSpecialHours.findUnique({
      where: { id: dateId },
    });

    if (!specialDate) {
      return NextResponse.json({ error: "Special date not found" }, { status: 404 });
    }

    if (specialDate.clubId !== clubId) {
      return NextResponse.json(
        { error: "Special date does not belong to this club" },
        { status: 404 }
      );
    }

    return NextResponse.json(specialDate);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching special date:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/clubs/[id]/special-dates/[dateId]
 * Update a specific special date
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; dateId: string }> }
) {
  const authResult = await requireAnyAdmin(request);

  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const resolvedParams = await params;
    const { id: clubId, dateId } = resolvedParams;

    // Check access permission
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

    // Check if special date exists and belongs to the club
    const existingSpecialDate = await prisma.clubSpecialHours.findUnique({
      where: { id: dateId },
    });

    if (!existingSpecialDate) {
      return NextResponse.json({ error: "Special date not found" }, { status: 404 });
    }

    if (existingSpecialDate.clubId !== clubId) {
      return NextResponse.json(
        { error: "Special date does not belong to this club" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { date, openTime, closeTime, isClosed, reason } = body;

    // Validate that times are correct if not closed
    if (isClosed === false && openTime && closeTime) {
      if (openTime >= closeTime) {
        return NextResponse.json(
          { error: "Opening time must be before closing time" },
          { status: 400 }
        );
      }
    }

    // Check for date conflicts (if date is being changed)
    if (date && date !== existingSpecialDate.date.toISOString().split('T')[0]) {
      const conflictingDate = await prisma.clubSpecialHours.findFirst({
        where: {
          clubId,
          date: new Date(date),
          id: { not: dateId },
        },
      });

      if (conflictingDate) {
        return NextResponse.json(
          { error: "A special date for this day already exists" },
          { status: 409 }
        );
      }
    }

    // Update the special date
    const updatedSpecialDate = await prisma.clubSpecialHours.update({
      where: { id: dateId },
      data: {
        ...(date !== undefined && { date: new Date(date) }),
        ...(openTime !== undefined && { openTime: openTime || null }),
        ...(closeTime !== undefined && { closeTime: closeTime || null }),
        ...(isClosed !== undefined && { isClosed }),
        ...(reason !== undefined && { reason: reason || null }),
      },
    });

    return NextResponse.json(updatedSpecialDate);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error updating special date:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/clubs/[id]/special-dates/[dateId]
 * Delete a specific special date
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; dateId: string }> }
) {
  const authResult = await requireAnyAdmin(request);

  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const resolvedParams = await params;
    const { id: clubId, dateId } = resolvedParams;

    // Check access permission
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

    // Check if special date exists and belongs to the club
    const existingSpecialDate = await prisma.clubSpecialHours.findUnique({
      where: { id: dateId },
    });

    if (!existingSpecialDate) {
      return NextResponse.json({ error: "Special date not found" }, { status: 404 });
    }

    if (existingSpecialDate.clubId !== clubId) {
      return NextResponse.json(
        { error: "Special date does not belong to this club" },
        { status: 404 }
      );
    }

    // Delete the special date
    await prisma.clubSpecialHours.delete({
      where: { id: dateId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error deleting special date:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
