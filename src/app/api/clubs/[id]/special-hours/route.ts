import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireRole";

interface SpecialHoursRequest {
  date: string;
  openTime: number;
  closeTime: number;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const clubId = resolvedParams.id;

    // Check if club exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // Get query params for date range
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    // Build query
    const where: { clubId: string; date?: { gte?: Date; lte?: Date } } = { clubId };
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        const start = new Date(`${startDate}T00:00:00.000Z`);
        if (!isNaN(start.getTime())) {
          where.date.gte = start;
        }
      }
      if (endDate) {
        const end = new Date(`${endDate}T00:00:00.000Z`);
        if (!isNaN(end.getTime())) {
          where.date.lte = end;
        }
      }
    }

    const specialHours = await prisma.clubSpecialHours.findMany({
      where,
      orderBy: { date: "asc" },
      select: {
        id: true,
        date: true,
        openTime: true,
        closeTime: true,
      },
    });

    return NextResponse.json({
      specialHours: specialHours.map((sh) => ({
        id: sh.id,
        date: sh.date.toISOString().split("T")[0],
        openTime: sh.openTime,
        closeTime: sh.closeTime,
      })),
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching special hours:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require admin role
  const authResult = await requireRole(request, ["admin"]);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const resolvedParams = await params;
    const clubId = resolvedParams.id;

    // Check if club exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    const body: SpecialHoursRequest = await request.json();

    // Validate input
    if (!body.date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    const targetDate = new Date(`${body.date}T00:00:00.000Z`);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    if (
      typeof body.openTime !== "number" ||
      body.openTime < 0 ||
      body.openTime > 23
    ) {
      return NextResponse.json(
        { error: "openTime must be a number between 0 and 23" },
        { status: 400 }
      );
    }

    if (
      typeof body.closeTime !== "number" ||
      body.closeTime < 0 ||
      body.closeTime > 24
    ) {
      return NextResponse.json(
        { error: "closeTime must be a number between 0 and 24" },
        { status: 400 }
      );
    }

    if (body.openTime >= body.closeTime) {
      return NextResponse.json(
        { error: "openTime must be before closeTime" },
        { status: 400 }
      );
    }

    // Create or update special hours using upsert
    const specialHours = await prisma.clubSpecialHours.upsert({
      where: {
        clubId_date: {
          clubId,
          date: targetDate,
        },
      },
      create: {
        clubId,
        date: targetDate,
        openTime: body.openTime,
        closeTime: body.closeTime,
      },
      update: {
        openTime: body.openTime,
        closeTime: body.closeTime,
      },
    });

    return NextResponse.json(
      {
        id: specialHours.id,
        date: specialHours.date.toISOString().split("T")[0],
        openTime: specialHours.openTime,
        closeTime: specialHours.closeTime,
      },
      { status: 201 }
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error creating special hours:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
