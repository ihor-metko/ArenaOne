import { prisma } from "@/lib/prisma";

// Default business hours when no schedule is configured
const DEFAULT_OPEN_HOUR = 9;
const DEFAULT_CLOSE_HOUR = 22;

export interface BusinessHours {
  openTime: number;
  closeTime: number;
}

interface ClubWeeklySchedule {
  mondayOpen: number | null;
  mondayClose: number | null;
  tuesdayOpen: number | null;
  tuesdayClose: number | null;
  wednesdayOpen: number | null;
  wednesdayClose: number | null;
  thursdayOpen: number | null;
  thursdayClose: number | null;
  fridayOpen: number | null;
  fridayClose: number | null;
  saturdayOpen: number | null;
  saturdayClose: number | null;
  sundayOpen: number | null;
  sundayClose: number | null;
}

// Get open/close hours for a specific day of week (0 = Sunday, 6 = Saturday)
function getHoursForDay(club: ClubWeeklySchedule, dayOfWeek: number): { open: number | null; close: number | null } {
  switch (dayOfWeek) {
    case 0: return { open: club.sundayOpen, close: club.sundayClose };
    case 1: return { open: club.mondayOpen, close: club.mondayClose };
    case 2: return { open: club.tuesdayOpen, close: club.tuesdayClose };
    case 3: return { open: club.wednesdayOpen, close: club.wednesdayClose };
    case 4: return { open: club.thursdayOpen, close: club.thursdayClose };
    case 5: return { open: club.fridayOpen, close: club.fridayClose };
    case 6: return { open: club.saturdayOpen, close: club.saturdayClose };
    default: return { open: null, close: null };
  }
}

/**
 * Resolves the effective business hours for a court on a specific date.
 *
 * Priority:
 * 1. Court-level overrides (if courtId provided and court has courtOpenTime/courtCloseTime)
 * 2. Special day override (ClubSpecialHours for the specific date)
 * 3. Weekly schedule (from Club model based on day of week)
 * 4. Default hours (9-22)
 *
 * Note: Court hours must be within club hours (intersection is returned)
 */
export async function resolveBusinessHours(
  clubId: string,
  date: Date,
  courtId?: string
): Promise<BusinessHours> {
  // Normalize date to start of day
  const dateStr = date.toISOString().split("T")[0];
  const targetDate = new Date(`${dateStr}T00:00:00.000Z`);
  const dayOfWeek = targetDate.getUTCDay();

  // Fetch club with weekly schedule
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: {
      mondayOpen: true,
      mondayClose: true,
      tuesdayOpen: true,
      tuesdayClose: true,
      wednesdayOpen: true,
      wednesdayClose: true,
      thursdayOpen: true,
      thursdayClose: true,
      fridayOpen: true,
      fridayClose: true,
      saturdayOpen: true,
      saturdayClose: true,
      sundayOpen: true,
      sundayClose: true,
    },
  });

  if (!club) {
    return { openTime: DEFAULT_OPEN_HOUR, closeTime: DEFAULT_CLOSE_HOUR };
  }

  // Check for special hours override for this specific date
  const specialHours = await prisma.clubSpecialHours.findUnique({
    where: {
      clubId_date: {
        clubId,
        date: targetDate,
      },
    },
  });

  // Determine club-level hours
  let clubOpenTime: number;
  let clubCloseTime: number;

  if (specialHours) {
    // Use special hours for this date
    clubOpenTime = specialHours.openTime;
    clubCloseTime = specialHours.closeTime;
  } else {
    // Use weekly schedule based on day of week
    const dayHours = getHoursForDay(club, dayOfWeek);
    clubOpenTime = dayHours.open ?? DEFAULT_OPEN_HOUR;
    clubCloseTime = dayHours.close ?? DEFAULT_CLOSE_HOUR;
  }

  // If no courtId provided, return club-level hours
  if (!courtId) {
    return { openTime: clubOpenTime, closeTime: clubCloseTime };
  }

  // Fetch court-specific hours
  const court = await prisma.court.findUnique({
    where: { id: courtId },
    select: {
      courtOpenTime: true,
      courtCloseTime: true,
    },
  });

  if (!court) {
    return { openTime: clubOpenTime, closeTime: clubCloseTime };
  }

  // If court has custom hours, calculate intersection with club hours
  let effectiveOpenTime = clubOpenTime;
  let effectiveCloseTime = clubCloseTime;

  if (court.courtOpenTime !== null) {
    // Court opens later than club -> use court open time
    effectiveOpenTime = Math.max(clubOpenTime, court.courtOpenTime);
  }

  if (court.courtCloseTime !== null) {
    // Court closes earlier than club -> use court close time
    effectiveCloseTime = Math.min(clubCloseTime, court.courtCloseTime);
  }

  // Ensure valid range
  if (effectiveOpenTime >= effectiveCloseTime) {
    // Invalid range - fall back to club hours
    return { openTime: clubOpenTime, closeTime: clubCloseTime };
  }

  return { openTime: effectiveOpenTime, closeTime: effectiveCloseTime };
}

/**
 * Gets the weekly schedule for a club.
 */
export async function getClubWeeklySchedule(clubId: string) {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: {
      mondayOpen: true,
      mondayClose: true,
      tuesdayOpen: true,
      tuesdayClose: true,
      wednesdayOpen: true,
      wednesdayClose: true,
      thursdayOpen: true,
      thursdayClose: true,
      fridayOpen: true,
      fridayClose: true,
      saturdayOpen: true,
      saturdayClose: true,
      sundayOpen: true,
      sundayClose: true,
    },
  });

  if (!club) {
    return null;
  }

  return {
    monday: { open: club.mondayOpen, close: club.mondayClose },
    tuesday: { open: club.tuesdayOpen, close: club.tuesdayClose },
    wednesday: { open: club.wednesdayOpen, close: club.wednesdayClose },
    thursday: { open: club.thursdayOpen, close: club.thursdayClose },
    friday: { open: club.fridayOpen, close: club.fridayClose },
    saturday: { open: club.saturdayOpen, close: club.saturdayClose },
    sunday: { open: club.sundayOpen, close: club.sundayClose },
  };
}

/**
 * Gets special hours for a club on a specific date.
 */
export async function getClubSpecialHours(clubId: string, date: Date) {
  const dateStr = date.toISOString().split("T")[0];
  const targetDate = new Date(`${dateStr}T00:00:00.000Z`);

  return prisma.clubSpecialHours.findUnique({
    where: {
      clubId_date: {
        clubId,
        date: targetDate,
      },
    },
  });
}
