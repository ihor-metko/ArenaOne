export interface Court {
  id: string;
  name: string;
  slug?: string | null;
  type?: string | null;
  surface?: string | null;
  indoor: boolean;
  defaultPriceCents: number;
  imageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AvailabilitySlot {
  start: string;
  end: string;
  status: "available" | "booked" | "partial" | "pending";
  priceCents?: number; // Optional price in cents for the slot
}

export interface AvailabilityResponse {
  date: string;
  slots: AvailabilitySlot[];
}

export interface PriceSegment {
  start: string; // "HH:MM" format
  end: string;   // "HH:MM" format
  priceCents: number;
}

export interface PriceTimelineResponse {
  date: string;
  courtId: string;
  defaultPriceCents: number;
  timeline: PriceSegment[];
}

// Weekly availability types
export interface CourtAvailabilityStatus {
  courtId: string;
  courtName: string;
  courtType: string | null;
  indoor: boolean;
  status: "available" | "booked" | "partial" | "pending";
}

export interface HourSlotAvailability {
  hour: number;
  courts: CourtAvailabilityStatus[];
  summary: {
    available: number;
    booked: number;
    partial: number;
    pending: number;
    total: number;
  };
  overallStatus: "available" | "partial" | "booked" | "pending";
}

export interface DayAvailability {
  date: string;
  dayOfWeek: number;
  dayName: string;
  hours: HourSlotAvailability[];
}

export interface WeeklyAvailabilityResponse {
  weekStart: string;
  weekEnd: string;
  days: DayAvailability[];
  courts: Array<{
    id: string;
    name: string;
    type: string | null;
    indoor: boolean;
  }>;
}

// 30-minute slot types for variable booking durations
export interface SlotSummary {
  slotStart: string; // ISO datetime e.g. 2025-12-03T14:00:00Z
  availableCount: number; // number of courts free in this 30-min slot
  totalCount: number; // total courts in club/filter
}

export interface Booking {
  courtId: string;
  start: string;
  end: string;
  status: "confirmed" | "pending" | "reserved" | "paid";
}

export interface HalfHourSlotAvailability {
  slotStart: string; // ISO datetime or HH:MM format
  slotEnd: string;   // ISO datetime or HH:MM format
  courts: CourtAvailabilityStatus[];
  summary: {
    available: number;
    booked: number;
    partial: number;
    pending: number;
    total: number;
  };
  overallStatus: "available" | "partial" | "booked" | "pending";
}

export interface DayAvailability30Min {
  date: string;
  dayOfWeek: number;
  dayName: string;
  slots: HalfHourSlotAvailability[];
  bookingsByCourt?: Record<string, Booking[]>;
}

export interface WeeklyAvailability30MinResponse {
  weekStart: string;
  weekEnd: string;
  days: DayAvailability30Min[];
  courts: Array<{
    id: string;
    name: string;
    type: string | null;
    indoor: boolean;
  }>;
}

// Duration options for bookings (in minutes)
export const BOOKING_DURATION_OPTIONS = [30, 60, 90, 120] as const;
export type BookingDuration = typeof BOOKING_DURATION_OPTIONS[number];
