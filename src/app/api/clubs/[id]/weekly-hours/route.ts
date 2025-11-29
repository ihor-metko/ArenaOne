import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireRole";
import { getClubWeeklySchedule } from "@/server/utils/resolveBusinessHours";

interface DayHours {
  open: number | null;
  close: number | null;
}

interface WeeklyHoursRequest {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

function validateDayHours(day: string, hours: DayHours | undefined): string | null {
  if (!hours) return null;
  
  if (hours.open !== null && hours.close !== null) {
    if (typeof hours.open !== "number" || hours.open < 0 || hours.open > 23) {
      return `${day} open time must be a number between 0 and 23`;
    }
    if (typeof hours.close !== "number" || hours.close < 0 || hours.close > 24) {
      return `${day} close time must be a number between 0 and 24`;
    }
    if (hours.open >= hours.close) {
      return `${day} open time must be before close time`;
    }
  } else if ((hours.open !== null) !== (hours.close !== null)) {
    return `${day} must have both open and close times, or neither`;
  }
  
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const clubId = resolvedParams.id;

    const weeklyHours = await getClubWeeklySchedule(clubId);

    if (!weeklyHours) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    return NextResponse.json(weeklyHours);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching weekly hours:", error);
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

    const body: WeeklyHoursRequest = await request.json();

    // Validate each day
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
    for (const day of days) {
      const error = validateDayHours(day, body[day]);
      if (error) {
        return NextResponse.json({ error }, { status: 400 });
      }
    }

    // Build update data
    const updateData: Record<string, number | null> = {};
    
    if (body.monday) {
      updateData.mondayOpen = body.monday.open;
      updateData.mondayClose = body.monday.close;
    }
    if (body.tuesday) {
      updateData.tuesdayOpen = body.tuesday.open;
      updateData.tuesdayClose = body.tuesday.close;
    }
    if (body.wednesday) {
      updateData.wednesdayOpen = body.wednesday.open;
      updateData.wednesdayClose = body.wednesday.close;
    }
    if (body.thursday) {
      updateData.thursdayOpen = body.thursday.open;
      updateData.thursdayClose = body.thursday.close;
    }
    if (body.friday) {
      updateData.fridayOpen = body.friday.open;
      updateData.fridayClose = body.friday.close;
    }
    if (body.saturday) {
      updateData.saturdayOpen = body.saturday.open;
      updateData.saturdayClose = body.saturday.close;
    }
    if (body.sunday) {
      updateData.sundayOpen = body.sunday.open;
      updateData.sundayClose = body.sunday.close;
    }

    await prisma.club.update({
      where: { id: clubId },
      data: updateData,
    });

    // Fetch and return the updated schedule
    const updatedSchedule = await getClubWeeklySchedule(clubId);

    return NextResponse.json(updatedSchedule);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error updating weekly hours:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
