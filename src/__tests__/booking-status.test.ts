import {
  calculateBookingStatus,
  getDynamicStatus,
  shouldMarkAsCompleted,
  shouldCancelUnpaidBooking,
  getStatusLabel,
  getStatusColorClass,
  isTerminalStatus,
  toBookingStatus,
} from "@/utils/bookingStatus";
import { PAYMENT_TIMEOUT_MS } from "@/types/booking";

describe("Booking Status Utilities", () => {
  describe("calculateBookingStatus", () => {
    it("should return 'reserved' for future bookings", () => {
      const now = new Date("2024-01-15T10:00:00Z");
      const start = new Date("2024-01-15T14:00:00Z");
      const end = new Date("2024-01-15T15:00:00Z");

      const status = calculateBookingStatus(
        start.toISOString(),
        end.toISOString(),
        "reserved",
        now
      );

      expect(status).toBe("reserved");
    });

    it("should return 'ongoing' for current bookings", () => {
      const now = new Date("2024-01-15T14:30:00Z");
      const start = new Date("2024-01-15T14:00:00Z");
      const end = new Date("2024-01-15T15:00:00Z");

      const status = calculateBookingStatus(
        start.toISOString(),
        end.toISOString(),
        "reserved",
        now
      );

      expect(status).toBe("ongoing");
    });

    it("should return 'completed' for past bookings", () => {
      const now = new Date("2024-01-15T16:00:00Z");
      const start = new Date("2024-01-15T14:00:00Z");
      const end = new Date("2024-01-15T15:00:00Z");

      const status = calculateBookingStatus(
        start.toISOString(),
        end.toISOString(),
        "reserved",
        now
      );

      expect(status).toBe("completed");
    });

    it("should preserve 'cancelled' status regardless of time", () => {
      const now = new Date("2024-01-15T14:30:00Z");
      const start = new Date("2024-01-15T14:00:00Z");
      const end = new Date("2024-01-15T15:00:00Z");

      const status = calculateBookingStatus(
        start.toISOString(),
        end.toISOString(),
        "cancelled",
        now
      );

      expect(status).toBe("cancelled");
    });

    it("should preserve 'no-show' status regardless of time", () => {
      const now = new Date("2024-01-15T16:00:00Z");
      const start = new Date("2024-01-15T14:00:00Z");
      const end = new Date("2024-01-15T15:00:00Z");

      const status = calculateBookingStatus(
        start.toISOString(),
        end.toISOString(),
        "no-show",
        now
      );

      expect(status).toBe("no-show");
    });

    it("should preserve 'completed' status from database", () => {
      const now = new Date("2024-01-15T16:00:00Z");
      const start = new Date("2024-01-15T14:00:00Z");
      const end = new Date("2024-01-15T15:00:00Z");

      const status = calculateBookingStatus(
        start.toISOString(),
        end.toISOString(),
        "completed",
        now
      );

      expect(status).toBe("completed");
    });

    it("should handle booking at exact start time as ongoing", () => {
      const now = new Date("2024-01-15T14:00:00Z");
      const start = new Date("2024-01-15T14:00:00Z");
      const end = new Date("2024-01-15T15:00:00Z");

      const status = calculateBookingStatus(
        start.toISOString(),
        end.toISOString(),
        "reserved",
        now
      );

      expect(status).toBe("ongoing");
    });

    it("should handle booking at exact end time as completed", () => {
      const now = new Date("2024-01-15T15:00:00Z");
      const start = new Date("2024-01-15T14:00:00Z");
      const end = new Date("2024-01-15T15:00:00Z");

      const status = calculateBookingStatus(
        start.toISOString(),
        end.toISOString(),
        "reserved",
        now
      );

      expect(status).toBe("completed");
    });
  });

  describe("getDynamicStatus", () => {
    it("should return 'reserved' for future bookings", () => {
      const now = new Date("2024-01-15T10:00:00Z");
      const start = new Date("2024-01-15T14:00:00Z");
      const end = new Date("2024-01-15T15:00:00Z");

      const status = getDynamicStatus(
        start.toISOString(),
        end.toISOString(),
        now
      );

      expect(status).toBe("reserved");
    });

    it("should return 'ongoing' for current bookings", () => {
      const now = new Date("2024-01-15T14:30:00Z");
      const start = new Date("2024-01-15T14:00:00Z");
      const end = new Date("2024-01-15T15:00:00Z");

      const status = getDynamicStatus(
        start.toISOString(),
        end.toISOString(),
        now
      );

      expect(status).toBe("ongoing");
    });

    it("should return 'completed' for past bookings", () => {
      const now = new Date("2024-01-15T16:00:00Z");
      const start = new Date("2024-01-15T14:00:00Z");
      const end = new Date("2024-01-15T15:00:00Z");

      const status = getDynamicStatus(
        start.toISOString(),
        end.toISOString(),
        now
      );

      expect(status).toBe("completed");
    });
  });

  describe("shouldMarkAsCompleted", () => {
    it("should return true for past bookings with non-terminal status", () => {
      const now = new Date("2024-01-15T16:00:00Z");
      const end = new Date("2024-01-15T15:00:00Z");

      expect(shouldMarkAsCompleted(end.toISOString(), "reserved", now)).toBe(
        true
      );
      expect(shouldMarkAsCompleted(end.toISOString(), "paid", now)).toBe(true);
      expect(shouldMarkAsCompleted(end.toISOString(), "pending", now)).toBe(
        true
      );
    });

    it("should return false for future bookings", () => {
      const now = new Date("2024-01-15T14:00:00Z");
      const end = new Date("2024-01-15T15:00:00Z");

      expect(shouldMarkAsCompleted(end.toISOString(), "reserved", now)).toBe(
        false
      );
    });

    it("should return false for bookings with terminal status", () => {
      const now = new Date("2024-01-15T16:00:00Z");
      const end = new Date("2024-01-15T15:00:00Z");

      expect(shouldMarkAsCompleted(end.toISOString(), "cancelled", now)).toBe(
        false
      );
      expect(shouldMarkAsCompleted(end.toISOString(), "no-show", now)).toBe(
        false
      );
      expect(shouldMarkAsCompleted(end.toISOString(), "completed", now)).toBe(
        false
      );
    });
  });

  describe("getStatusLabel", () => {
    it("should return human-readable labels for all statuses", () => {
      expect(getStatusLabel("Confirmed")).toBe("Confirmed");
      expect(getStatusLabel("UPCOMING")).toBe("Upcoming");
      expect(getStatusLabel("Completed")).toBe("Completed");
      expect(getStatusLabel("Cancelled")).toBe("Cancelled");
      expect(getStatusLabel("No-show")).toBe("No-show");
    });
  });

  describe("getStatusColorClass", () => {
    it("should return correct color classes for all statuses", () => {
      expect(getStatusColorClass("Confirmed")).toBe("warning");
      expect(getStatusColorClass("UPCOMING")).toBe("active");
      expect(getStatusColorClass("Completed")).toBe("neutral");
      expect(getStatusColorClass("Cancelled")).toBe("danger");
      expect(getStatusColorClass("No-show")).toBe("danger");
    });
  });

  describe("isTerminalStatus", () => {
    it("should return true for terminal statuses", () => {
      expect(isTerminalStatus("Cancelled")).toBe(true);
      expect(isTerminalStatus("No-show")).toBe(true);
      expect(isTerminalStatus("Completed")).toBe(true);
    });

    it("should return false for non-terminal statuses", () => {
      expect(isTerminalStatus("Confirmed")).toBe(false);
      expect(isTerminalStatus("UPCOMING")).toBe(false);
    });
  });

  describe("toBookingStatus", () => {
    it("should convert valid status strings to BookingStatus", () => {
      expect(toBookingStatus("pending")).toBe("pending");
      expect(toBookingStatus("paid")).toBe("paid");
      expect(toBookingStatus("reserved")).toBe("reserved");
      expect(toBookingStatus("cancelled")).toBe("cancelled");
      expect(toBookingStatus("no-show")).toBe("no-show");
      expect(toBookingStatus("completed")).toBe("completed");
    });

    it("should default to 'reserved' for invalid status strings", () => {
      expect(toBookingStatus("invalid")).toBe("reserved");
      expect(toBookingStatus("unknown")).toBe("reserved");
      expect(toBookingStatus("")).toBe("reserved");
    });
  });

  describe("shouldCancelUnpaidBooking", () => {
    it("should return true for Confirmed + Unpaid bookings past payment timeout", () => {
      const now = new Date("2024-01-15T14:00:00Z");
      const createdAt = new Date("2024-01-15T13:00:00Z"); // 1 hour ago (60 minutes)
      
      // Should cancel if timeout is 30 minutes
      expect(
        shouldCancelUnpaidBooking(
          "Confirmed",
          "Unpaid",
          createdAt.toISOString(),
          PAYMENT_TIMEOUT_MS,
          now
        )
      ).toBe(true);
    });

    it("should return false for Confirmed + Unpaid bookings within payment timeout", () => {
      const now = new Date("2024-01-15T14:00:00Z");
      const createdAt = new Date("2024-01-15T13:50:00Z"); // 10 minutes ago
      
      // Should NOT cancel if timeout is 30 minutes
      expect(
        shouldCancelUnpaidBooking(
          "Confirmed",
          "Unpaid",
          createdAt.toISOString(),
          PAYMENT_TIMEOUT_MS,
          now
        )
      ).toBe(false);
    });

    it("should return false for Confirmed + Paid bookings", () => {
      const now = new Date("2024-01-15T14:00:00Z");
      const createdAt = new Date("2024-01-15T13:00:00Z"); // 1 hour ago
      
      expect(
        shouldCancelUnpaidBooking(
          "Confirmed",
          "Paid",
          createdAt.toISOString(),
          PAYMENT_TIMEOUT_MS,
          now
        )
      ).toBe(false);
    });

    it("should return false for UPCOMING + Unpaid bookings", () => {
      const now = new Date("2024-01-15T14:00:00Z");
      const createdAt = new Date("2024-01-15T13:00:00Z"); // 1 hour ago
      
      expect(
        shouldCancelUnpaidBooking(
          "UPCOMING",
          "Unpaid",
          createdAt.toISOString(),
          PAYMENT_TIMEOUT_MS,
          now
        )
      ).toBe(false);
    });

    it("should return false for Cancelled bookings", () => {
      const now = new Date("2024-01-15T14:00:00Z");
      const createdAt = new Date("2024-01-15T13:00:00Z"); // 1 hour ago
      
      expect(
        shouldCancelUnpaidBooking(
          "Cancelled",
          "Unpaid",
          createdAt.toISOString(),
          PAYMENT_TIMEOUT_MS,
          now
        )
      ).toBe(false);
    });

    it("should handle exactly at timeout boundary", () => {
      const now = new Date("2024-01-15T14:30:00Z");
      const createdAt = new Date("2024-01-15T14:00:00Z"); // Exactly 30 minutes ago
      
      // Should cancel at exactly the timeout
      expect(
        shouldCancelUnpaidBooking(
          "Confirmed",
          "Unpaid",
          createdAt.toISOString(),
          30 * 60 * 1000, // 30 minutes
          now
        )
      ).toBe(true);
    });
  });
});

