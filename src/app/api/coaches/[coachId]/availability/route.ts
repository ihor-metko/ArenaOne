import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireRole";
import { isValidTimeFormat } from "@/utils/dateTime";
import type { CoachWeeklyAvailabilitySlot, CreateAvailabilitySlotRequest } from "@/types/coach";

/**
 * Validates that startTime is before endTime
 */
function isValidTimeRange(startTime: string, endTime: string): boolean {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return startMinutes < endMinutes;
}

/**
 * Checks if two time ranges overlap
 */
function doTimesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const [s1h, s1m] = start1.split(":").map(Number);
  const [e1h, e1m] = end1.split(":").map(Number);
  const [s2h, s2m] = start2.split(":").map(Number);
  const [e2h, e2m] = end2.split(":").map(Number);
  
  const start1Minutes = s1h * 60 + s1m;
  const end1Minutes = e1h * 60 + e1m;
  const start2Minutes = s2h * 60 + s2m;
  const end2Minutes = e2h * 60 + e2m;
  
  return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
}

/**
 * Validates day of week (0-6)
 */
function isValidDayOfWeek(day: unknown): day is number {
  return typeof day === "number" && Number.isInteger(day) && day >= 0 && day <= 6;
}

/**
 * GET /api/coaches/[coachId]/availability
 * Returns all weekly availability slots for the specified coach
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ coachId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { coachId } = resolvedParams;

    if (!coachId) {
      return NextResponse.json(
        { error: "Missing coach ID" },
        { status: 400 }
      );
    }

    // Verify the coach exists
    const coach = await prisma.coach.findUnique({
      where: { id: coachId },
    });

    if (!coach) {
      return NextResponse.json(
        { error: "Coach not found" },
        { status: 404 }
      );
    }

    // Fetch all weekly availability slots for the coach
    const slots = await prisma.coachWeeklyAvailability.findMany({
      where: { coachId },
      orderBy: [
        { dayOfWeek: "asc" },
        { startTime: "asc" },
      ],
    });

    const formattedSlots: CoachWeeklyAvailabilitySlot[] = slots.map((slot) => ({
      id: slot.id,
      coachId: slot.coachId,
      dayOfWeek: slot.dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6,
      startTime: slot.startTime,
      endTime: slot.endTime,
      note: slot.note,
      createdAt: slot.createdAt.toISOString(),
      updatedAt: slot.updatedAt.toISOString(),
    }));

    return NextResponse.json({ slots: formattedSlots });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching coach weekly availability:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/coaches/[coachId]/availability
 * Create a new weekly availability slot for the coach
 * Only the coach themselves or an admin can add slots
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ coachId: string }> }
) {
  try {
    // Role check: Only coach and admin can access
    const authResult = await requireRole(request, ["coach", "admin"]);
    if (!authResult.authorized) {
      return authResult.response;
    }

    const resolvedParams = await params;
    const { coachId } = resolvedParams;

    if (!coachId) {
      return NextResponse.json(
        { error: "Missing coach ID" },
        { status: 400 }
      );
    }

    // Verify the coach exists and get their user ID
    const coach = await prisma.coach.findUnique({
      where: { id: coachId },
    });

    if (!coach) {
      return NextResponse.json(
        { error: "Coach not found" },
        { status: 404 }
      );
    }

    // Verify the authenticated user is the coach or an admin
    if (authResult.userRole !== "admin" && coach.userId !== authResult.userId) {
      return NextResponse.json(
        { error: "Forbidden: You can only modify your own availability" },
        { status: 403 }
      );
    }

    const body: CreateAvailabilitySlotRequest = await request.json();
    const { dayOfWeek, startTime, endTime, note } = body;

    // Validate required fields
    if (dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields: dayOfWeek, startTime, and endTime are required" },
        { status: 400 }
      );
    }

    // Validate dayOfWeek
    if (!isValidDayOfWeek(dayOfWeek)) {
      return NextResponse.json(
        { error: "Invalid dayOfWeek. Must be an integer from 0 (Sunday) to 6 (Saturday)" },
        { status: 400 }
      );
    }

    // Validate time format
    if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
      return NextResponse.json(
        { error: "Invalid time format. Use HH:mm" },
        { status: 400 }
      );
    }

    // Validate startTime < endTime
    if (!isValidTimeRange(startTime, endTime)) {
      return NextResponse.json(
        { error: "Start time must be before end time" },
        { status: 400 }
      );
    }

    // Check for overlapping slots on the same day
    const existingSlots = await prisma.coachWeeklyAvailability.findMany({
      where: {
        coachId,
        dayOfWeek,
      },
    });

    const hasOverlap = existingSlots.some((slot) =>
      doTimesOverlap(startTime, endTime, slot.startTime, slot.endTime)
    );

    if (hasOverlap) {
      return NextResponse.json(
        { error: "This slot overlaps with an existing availability slot" },
        { status: 409 }
      );
    }

    // Create the new availability slot
    const slot = await prisma.coachWeeklyAvailability.create({
      data: {
        coachId,
        dayOfWeek,
        startTime,
        endTime,
        note: note || null,
      },
    });

    const formattedSlot: CoachWeeklyAvailabilitySlot = {
      id: slot.id,
      coachId: slot.coachId,
      dayOfWeek: slot.dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6,
      startTime: slot.startTime,
      endTime: slot.endTime,
      note: slot.note,
      createdAt: slot.createdAt.toISOString(),
      updatedAt: slot.updatedAt.toISOString(),
    };

    return NextResponse.json(formattedSlot, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error creating coach weekly availability:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
