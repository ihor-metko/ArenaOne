/**
 * Types for TimelineBookingWizard
 * 
 * This wizard is used for booking from the weekly availability timeline.
 * It starts at Step 2 (court selection) since date/time are pre-selected.
 */

import type { CourtAvailabilityStatus } from "@/types/court";

export interface TimelineBookingWizardProps {
  clubId: string;
  isOpen: boolean;
  onClose: () => void;
  date: string;
  hour: number;
  courts: CourtAvailabilityStatus[];
  onBookingComplete?: (
    bookingId: string,
    courtId: string,
    date: string,
    startTime: string,
    endTime: string
  ) => void;
}

export interface WizardCourt {
  id: string;
  name: string;
  slug: string | null;
  type: string | null;
  surface: string | null;
  indoor: boolean;
  defaultPriceCents: number;
  priceCents?: number;
  available: boolean;
  unavailableReason?: string;
}

export type PaymentMethod = "card" | "apple_pay" | "google_pay";

export interface TimelineWizardState {
  currentStep: 2 | 3; // Only steps 2 and 3 since date/time are pre-selected
  selectedCourtId: string | null;
  selectedCourt: WizardCourt | null;
  paymentMethod: PaymentMethod | null;
  availableCourts: WizardCourt[];
  isLoadingCourts: boolean;
  courtsError: string | null;
  isSubmitting: boolean;
  submitError: string | null;
  isComplete: boolean;
  bookingId: string | null;
}

// Wizard steps for timeline booking (only steps 2 and 3)
export const TIMELINE_WIZARD_STEPS = [
  { id: 2, label: "selectCourt" },
  { id: 3, label: "payment" },
] as const;

// Default duration for timeline bookings (1 hour)
export const DEFAULT_DURATION_MINUTES = 60;

/**
 * Format hour to HH:MM string
 */
export function formatHourToTime(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`;
}

/**
 * Calculate end time based on start hour and duration in minutes
 */
export function calculateEndTime(startHour: number, durationMinutes: number): string {
  const totalMinutes = startHour * 60 + durationMinutes;
  const endHour = Math.floor(totalMinutes / 60) % 24;
  const endMinute = totalMinutes % 60;
  return `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;
}

/**
 * Format date for display
 */
export function formatDateDisplay(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format time range for display
 */
export function formatTimeDisplay(startTime: string, endTime: string): string {
  return `${startTime} - ${endTime}`;
}
