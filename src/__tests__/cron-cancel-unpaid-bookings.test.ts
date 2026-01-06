import { shouldCancelUnpaidBooking } from "@/utils/bookingStatus";
import { PAYMENT_TIMEOUT_MS, BOOKING_STATUS, PAYMENT_STATUS } from "@/types/booking";

describe("Cron Job - Cancel Unpaid Bookings", () => {
  describe("Payment timeout cancellation logic", () => {
    it("should identify bookings that need cancellation", () => {
      const now = new Date("2024-01-15T14:00:00Z");
      
      // Test case 1: Booking created 1 hour ago (should cancel)
      const booking1 = {
        bookingStatus: BOOKING_STATUS.CONFIRMED,
        paymentStatus: PAYMENT_STATUS.UNPAID,
        createdAt: new Date("2024-01-15T13:00:00Z").toISOString(),
      };
      
      expect(
        shouldCancelUnpaidBooking(
          booking1.bookingStatus,
          booking1.paymentStatus,
          booking1.createdAt,
          PAYMENT_TIMEOUT_MS,
          now
        )
      ).toBe(true);
      
      // Test case 2: Booking created 10 minutes ago (should NOT cancel)
      const booking2 = {
        bookingStatus: BOOKING_STATUS.CONFIRMED,
        paymentStatus: PAYMENT_STATUS.UNPAID,
        createdAt: new Date("2024-01-15T13:50:00Z").toISOString(),
      };
      
      expect(
        shouldCancelUnpaidBooking(
          booking2.bookingStatus,
          booking2.paymentStatus,
          booking2.createdAt,
          PAYMENT_TIMEOUT_MS,
          now
        )
      ).toBe(false);
      
      // Test case 3: Paid booking (should NOT cancel)
      const booking3 = {
        bookingStatus: BOOKING_STATUS.CONFIRMED,
        paymentStatus: PAYMENT_STATUS.PAID,
        createdAt: new Date("2024-01-15T13:00:00Z").toISOString(),
      };
      
      expect(
        shouldCancelUnpaidBooking(
          booking3.bookingStatus,
          booking3.paymentStatus,
          booking3.createdAt,
          PAYMENT_TIMEOUT_MS,
          now
        )
      ).toBe(false);
      
      // Test case 4: UPCOMING booking (should NOT cancel)
      const booking4 = {
        bookingStatus: BOOKING_STATUS.UPCOMING,
        paymentStatus: PAYMENT_STATUS.UNPAID,
        createdAt: new Date("2024-01-15T13:00:00Z").toISOString(),
      };
      
      expect(
        shouldCancelUnpaidBooking(
          booking4.bookingStatus,
          booking4.paymentStatus,
          booking4.createdAt,
          PAYMENT_TIMEOUT_MS,
          now
        )
      ).toBe(false);
    });

    it("should handle edge cases correctly", () => {
      const now = new Date("2024-01-15T14:30:00Z");
      
      // Exactly at the timeout boundary
      const bookingAtBoundary = {
        bookingStatus: BOOKING_STATUS.CONFIRMED,
        paymentStatus: PAYMENT_STATUS.UNPAID,
        createdAt: new Date("2024-01-15T14:00:00Z").toISOString(),
      };
      
      expect(
        shouldCancelUnpaidBooking(
          bookingAtBoundary.bookingStatus,
          bookingAtBoundary.paymentStatus,
          bookingAtBoundary.createdAt,
          PAYMENT_TIMEOUT_MS,
          now
        )
      ).toBe(true);
      
      // Just before the timeout boundary (29 minutes 59 seconds)
      const bookingJustBefore = {
        bookingStatus: BOOKING_STATUS.CONFIRMED,
        paymentStatus: PAYMENT_STATUS.UNPAID,
        createdAt: new Date("2024-01-15T14:00:01Z").toISOString(),
      };
      
      expect(
        shouldCancelUnpaidBooking(
          bookingJustBefore.bookingStatus,
          bookingJustBefore.paymentStatus,
          bookingJustBefore.createdAt,
          PAYMENT_TIMEOUT_MS,
          now
        )
      ).toBe(false);
    });

    it("should not cancel bookings that are already cancelled", () => {
      const now = new Date("2024-01-15T14:00:00Z");
      
      const cancelledBooking = {
        bookingStatus: BOOKING_STATUS.CANCELLED,
        paymentStatus: PAYMENT_STATUS.UNPAID,
        createdAt: new Date("2024-01-15T13:00:00Z").toISOString(),
      };
      
      expect(
        shouldCancelUnpaidBooking(
          cancelledBooking.bookingStatus,
          cancelledBooking.paymentStatus,
          cancelledBooking.createdAt,
          PAYMENT_TIMEOUT_MS,
          now
        )
      ).toBe(false);
    });

    it("should verify payment timeout is 30 minutes", () => {
      // Ensure the timeout is set to 30 minutes as per requirements
      const expectedTimeoutMs = 30 * 60 * 1000; // 30 minutes in milliseconds
      expect(PAYMENT_TIMEOUT_MS).toBe(expectedTimeoutMs);
    });
  });
});
