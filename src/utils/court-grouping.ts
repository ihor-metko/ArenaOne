import type { CourtWithClubInfo, CourtGroup } from "@/types/court";

/**
 * Groups courts by their court group
 * Returns a map of groupId to array of courts
 * Courts without a group are returned under the key "ungrouped"
 */
export function groupCourtsByGroup(courts: CourtWithClubInfo[]): Map<string, CourtWithClubInfo[]> {
  const grouped = new Map<string, CourtWithClubInfo[]>();

  for (const court of courts) {
    const key = court.groupId || "ungrouped";
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(court);
  }

  return grouped;
}

/**
 * Groups courts by their court group for display
 * Returns an array of group objects with their courts
 */
export function groupCourtsForDisplay(
  courts: CourtWithClubInfo[]
): Array<{ group: CourtGroup | null; courts: CourtWithClubInfo[] }> {
  const groupMap = groupCourtsByGroup(courts);
  const result: Array<{ group: CourtGroup | null; courts: CourtWithClubInfo[] }> = [];

  // First add all groups with their courts
  for (const [groupId, groupCourts] of groupMap.entries()) {
    if (groupId === "ungrouped") continue;

    // Get group info from first court in the group
    const firstCourt = groupCourts[0];
    result.push({
      group: firstCourt.group || null,
      courts: groupCourts,
    });
  }

  // Add ungrouped courts at the end
  if (groupMap.has("ungrouped")) {
    result.push({
      group: null,
      courts: groupMap.get("ungrouped")!,
    });
  }

  return result;
}

/**
 * Calculate summary statistics for a court group
 */
export function getGroupStats(courts: CourtWithClubInfo[]) {
  const totalCourts = courts.length;
  const activeCourts = courts.filter((c) => c.isActive).length;
  const totalBookings = courts.reduce((sum, c) => sum + (c.bookingCount || 0), 0);

  return {
    totalCourts,
    activeCourts,
    inactiveCourts: totalCourts - activeCourts,
    totalBookings,
    averageBookings: totalCourts > 0 ? Math.round(totalBookings / totalCourts) : 0,
  };
}
