import { SportType } from "@/constants/sports";

/**
 * Booking status - represents the state of the reservation
 * - Active: Booking is active and confirmed
 * - Cancelled: Booking has been cancelled
 * - Completed: Booking has been completed
 * - No-show: User did not show up for the booking
 * - Pending: Booking is awaiting confirmation
 */
export type BookingStatus = "Active" | "Cancelled" | "Completed" | "No-show" | "Pending";

/**
 * Payment status - represents the financial state of the booking
 * - Paid: Payment has been completed
 * - Unpaid: Payment has not been made
 * - Refunded: Payment has been fully refunded
 * - PartiallyRefunded: Payment has been partially refunded
 * - PaymentPending: Payment is being processed
 */
export type PaymentStatus = "Paid" | "Unpaid" | "Refunded" | "PartiallyRefunded" | "PaymentPending";

/**
 * Legacy status types (for backward compatibility during migration)
 */
export type LegacyBookingStatus = "pending" | "paid" | "cancelled" | "reserved" | "no-show" | "completed" | "ongoing";

/**
 * Dynamic booking status types (calculated on the fly)
 * - reserved: booking exists but now < startAt
 * - ongoing: startAt <= now < endAt
 * - completed: now >= endAt
 */
export type DynamicBookingStatus = "reserved" | "ongoing" | "completed";

/**
 * Basic booking type
 */
export interface Booking {
  id: string;
  userId: string;
  courtId: string;
  coachId: string | null;
  start: string;
  end: string;
  price: number;
  sportType: SportType;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentId: string | null;
  createdAt: string;
}

/**
 * Booking with user and court information for display
 */
export interface BookingWithDetails extends Booking {
  userName: string | null;
  userEmail: string;
  courtName: string;
  clubId: string;
  clubName: string;
  paymentAvailable?: boolean;
  paymentProviders?: Array<'wayforpay' | 'liqpay'>;
}

/**
 * Booking for operations calendar view
 */
export interface OperationsBooking {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  courtId: string;
  courtName: string;
  start: string;
  end: string;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  price: number;
  sportType: SportType;
  coachId: string | null;
  coachName: string | null;
  createdAt: string;
}

/**
 * Request payload for creating a booking
 */
export interface CreateBookingPayload {
  userId: string;
  courtId: string;
  startTime: string;
  endTime: string;
  clubId?: string;
  coachId?: string;
}

/**
 * Response from creating a booking
 */
export interface CreateBookingResponse {
  bookingId: string;
  courtId: string;
  courtName: string;
  clubName: string;
  userName: string | null;
  userEmail: string;
  startTime: string;
  endTime: string;
  price: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentAvailable?: boolean;
  paymentProviders?: Array<'wayforpay' | 'liqpay'>;
}

/**
 * Request payload for updating a booking
 */
export interface UpdateBookingPayload {
  bookingStatus?: BookingStatus;
  paymentStatus?: PaymentStatus;
}

/**
 * Payment availability information for a booking
 */
export interface BookingPaymentAvailability {
  paymentAvailable: boolean;
  paymentProviders?: Array<'wayforpay' | 'liqpay'>;
}

/**
 * Payment intent request payload
 */
export interface CreatePaymentIntentRequest {
  bookingId: string;
}

/**
 * Payment intent response
 * Contains provider-specific payment data without secrets
 */
export interface CreatePaymentIntentResponse {
  provider: 'wayforpay' | 'liqpay';
  paymentUrl?: string;
  formData?: Record<string, unknown>;
  merchantAccount?: string; // Masked merchant ID for display
  amount: number;
  currency: string;
  orderReference: string;
}
