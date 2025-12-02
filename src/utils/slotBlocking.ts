/**
 * Slot blocking utility for WeeklyAvailabilityTimeline
 * 
 * BLOCKING RULES (client-side):
 * - Past days: Any day before the current local date is blocked
 * - Today: Slots with slotStartHour < currentLocalHour are blocked
 * - Ongoing slots: If slotStartHour === currentLocalHour, the slot is ALLOWED (not blocked)
 *   This allows users to book slots that are currently in progress (e.g., 20:00 slot at 20:05)
 * 
 * NOTE: These rules are UI-only. Server-side booking endpoints MUST enforce the same
 * blocking logic independently. Do not rely on client-side blocking alone.
 * 
 * TODO: Backend developers - ensure booking API validates same blocking rules server-side
 */

export type BlockReason = "past_day" | "past_hour" | null;

export interface SlotBlockStatus {
  isBlocked: boolean;
  reason: BlockReason;
}

/**
 * Determine if a slot is blocked based on current time.
 * 
 * @param slotDate - The date string (YYYY-MM-DD) of the slot
 * @param slotHour - The start hour of the slot (0-23)
 * @param now - Current Date object (client browser time)
 * @returns Object with isBlocked boolean and reason ('past_day' | 'past_hour' | null)
 * 
 * Blocking logic:
 * - Past day: slot date < current date → blocked
 * - Same day, past hour: slotHour < currentHour → blocked  
 * - Same day, current hour: slotHour === currentHour → NOT blocked (ongoing slot allowed)
 * - Future hours/days: NOT blocked
 */
export function isSlotBlocked(
  slotDate: string,
  slotHour: number,
  now: Date
): SlotBlockStatus {
  const slotDateObj = new Date(slotDate + "T00:00:00");
  const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const slotDateOnly = new Date(slotDateObj.getFullYear(), slotDateObj.getMonth(), slotDateObj.getDate());
  
  // Past day check
  if (slotDateOnly.getTime() < nowDateOnly.getTime()) {
    return { isBlocked: true, reason: "past_day" };
  }
  
  // Same day check - block only if slotHour < currentHour (strictly less)
  if (slotDateOnly.getTime() === nowDateOnly.getTime()) {
    const currentHour = now.getHours();
    if (slotHour < currentHour) {
      return { isBlocked: true, reason: "past_hour" };
    }
  }
  
  return { isBlocked: false, reason: null };
}
