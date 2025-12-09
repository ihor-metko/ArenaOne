import type { AvailabilitySlot } from "@/types/court";

/**
 * Format an ISO timestamp to HH:MM format
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

/**
 * Get CSS class for slot status
 */
export function getSlotStatusClass(status: AvailabilitySlot["status"]): string {
  switch (status) {
    case "available":
      return "im-court-card-slot--available";
    case "booked":
      return "im-court-card-slot--booked";
    case "partial":
      return "im-court-card-slot--partial";
    case "pending":
      return "im-court-card-slot--pending";
    default:
      return "";
  }
}

/**
 * Get status label for a slot
 */
export function getStatusLabel(
  status: AvailabilitySlot["status"],
  t: (key: string) => string
): string {
  switch (status) {
    case "available":
      return t("common.available");
    case "booked":
      return t("common.booked");
    case "partial":
      return t("clubDetail.limited");
    case "pending":
      return t("common.pending");
    default:
      return "";
  }
}

/**
 * Availability summary interface
 */
export interface AvailabilitySummary {
  available: number;
  total: number;
  status: "available" | "limited" | "unavailable";
}

/**
 * Calculate availability summary from slots
 */
export function calculateAvailabilitySummary(slots: AvailabilitySlot[]): AvailabilitySummary {
  if (slots.length === 0) {
    return { available: 0, total: 0, status: "unavailable" };
  }
  
  const available = slots.filter(slot => slot.status === "available" || slot.status === "partial").length;
  const total = slots.length;
  const ratio = available / total;
  
  let status: "available" | "limited" | "unavailable";
  if (ratio >= 0.5) {
    status = "available";
  } else if (ratio > 0) {
    status = "limited";
  } else {
    status = "unavailable";
  }
  
  return { available, total, status };
}
