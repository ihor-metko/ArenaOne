import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClubWeeklySchedule, getClubSpecialHours } from "@/server/utils/resolveBusinessHours";

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
      select: { id: true, name: true },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // Get date from query params (for special hours lookup)
    const url = new URL(request.url);
    const dateParam = url.searchParams.get("date");

    // Get weekly schedule
    const weeklyHours = await getClubWeeklySchedule(clubId);

    // Get special hours for the specific date if provided
    let specialHours = null;
    if (dateParam) {
      const date = new Date(dateParam);
      if (!isNaN(date.getTime())) {
        specialHours = await getClubSpecialHours(clubId, date);
      }
    }

    return NextResponse.json({
      clubId,
      weeklyHours,
      specialHours: specialHours
        ? {
            id: specialHours.id,
            date: specialHours.date.toISOString().split("T")[0],
            openTime: specialHours.openTime,
            closeTime: specialHours.closeTime,
          }
        : null,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching club hours:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
