import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAnyAdmin } from "@/lib/requireRole";
import { canAccessClub } from "@/lib/permissions/clubAccess";

/**
 * POST /api/admin/clubs/[id]/special-dates
 * Create a new special date
 */
export async function POST(
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

    // Check if club exists
    const existingClub = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!existingClub) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    const body = await request.json();
    const { date, openTime, closeTime, isClosed, reason } = body;

    // Validate required fields
    if (!date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    if (isClosed === undefined) {
      return NextResponse.json(
        { error: "isClosed is required" },
        { status: 400 }
      );
    }

    // Validate that times are correct if not closed
    if (!isClosed && openTime && closeTime) {
      if (openTime >= closeTime) {
        return NextResponse.json(
          { error: "Opening time must be before closing time" },
          { status: 400 }
        );
      }
    }

    // Check for date conflicts
    const existingDate = await prisma.clubSpecialHours.findFirst({
      where: {
        clubId,
        date: new Date(date),
      },
    });

    if (existingDate) {
      return NextResponse.json(
        { error: "A special date for this day already exists" },
        { status: 409 }
      );
    }

    // Create the special date
    const newSpecialDate = await prisma.clubSpecialHours.create({
      data: {
        clubId,
        date: new Date(date),
        openTime: isClosed ? null : (openTime || null),
        closeTime: isClosed ? null : (closeTime || null),
        isClosed,
        reason: reason || null,
      },
    });

    return NextResponse.json(newSpecialDate, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error creating special date:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/clubs/[id]/special-dates
 * List all special dates for a club
 */
export async function GET(
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

    const specialDates = await prisma.clubSpecialHours.findMany({
      where: { clubId },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ specialDates });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching special dates:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
