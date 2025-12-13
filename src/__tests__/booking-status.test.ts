import {
  calculateBookingStatus,
  getDynamicStatus,
  shouldMarkAsCompleted,
  getStatusLabel,
  getStatusColorClass,
} from "@/utils/bookingStatus";
import type { BookingStatus } from "@/types/booking";

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
      expect(getStatusLabel("pending")).toBe("Pending");
      expect(getStatusLabel("paid")).toBe("Paid");
      expect(getStatusLabel("reserved")).toBe("Reserved");
      expect(getStatusLabel("ongoing")).toBe("Ongoing");
      expect(getStatusLabel("completed")).toBe("Completed");
      expect(getStatusLabel("cancelled")).toBe("Cancelled");
      expect(getStatusLabel("no-show")).toBe("No-show");
    });
  });

  describe("getStatusColorClass", () => {
    it("should return correct color classes for all statuses", () => {
      expect(getStatusColorClass("pending")).toBe("warning");
      expect(getStatusColorClass("paid")).toBe("success");
      expect(getStatusColorClass("reserved")).toBe("info");
      expect(getStatusColorClass("ongoing")).toBe("active");
      expect(getStatusColorClass("completed")).toBe("neutral");
      expect(getStatusColorClass("cancelled")).toBe("danger");
      expect(getStatusColorClass("no-show")).toBe("danger");
    });
  });
});
