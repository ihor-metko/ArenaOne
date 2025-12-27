/**
 * Tests for Reactive Statistics Service
 * 
 * Tests reactive statistics update functionality when bookings change
 */

import {
  updateStatisticsForBooking,
  updateStatisticsForBookingChange,
} from "@/services/reactiveStatistics";
import { calculateAndStoreDailyStatistics } from "@/services/statisticsService";

// Mock the statistics service
jest.mock("@/services/statisticsService", () => ({
  calculateAndStoreDailyStatistics: jest.fn(),
}));

describe("Reactive Statistics Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console.error mock
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("updateStatisticsForBooking", () => {
    const clubId = "club-123";

    it("should update statistics for a single-day booking", async () => {
      const start = new Date("2024-01-15T10:00:00Z");
      const end = new Date("2024-01-15T11:00:00Z");

      (calculateAndStoreDailyStatistics as jest.Mock).mockResolvedValue({
        id: "stats-1",
        clubId,
        date: new Date("2024-01-15"),
        bookedSlots: 5,
        totalSlots: 20,
        occupancyPercentage: 25,
      });

      await updateStatisticsForBooking(clubId, start, end);

      expect(calculateAndStoreDailyStatistics).toHaveBeenCalledTimes(1);
      expect(calculateAndStoreDailyStatistics).toHaveBeenCalledWith(
        clubId,
        expect.any(Date)
      );

      // Verify the date is normalized to start of day
      const calledDate = (calculateAndStoreDailyStatistics as jest.Mock).mock.calls[0][1];
      expect(calledDate.getHours()).toBe(0);
      expect(calledDate.getMinutes()).toBe(0);
      expect(calledDate.getSeconds()).toBe(0);
      expect(calledDate.getMilliseconds()).toBe(0);
    });

    it("should update statistics for a multi-day booking", async () => {
      const start = new Date("2024-01-15T22:00:00Z");
      const end = new Date("2024-01-17T02:00:00Z"); // Spans 3 days

      (calculateAndStoreDailyStatistics as jest.Mock).mockResolvedValue({
        id: "stats-1",
        clubId,
        date: new Date("2024-01-15"),
        bookedSlots: 5,
        totalSlots: 20,
        occupancyPercentage: 25,
      });

      await updateStatisticsForBooking(clubId, start, end);

      // Should be called for all 3 affected dates
      expect(calculateAndStoreDailyStatistics).toHaveBeenCalledTimes(3);
    });

    it("should handle errors without throwing", async () => {
      const start = new Date("2024-01-15T10:00:00Z");
      const end = new Date("2024-01-15T11:00:00Z");

      (calculateAndStoreDailyStatistics as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      // Should not throw
      await expect(
        updateStatisticsForBooking(clubId, start, end)
      ).resolves.not.toThrow();

      // Error should be logged in development
      if (process.env.NODE_ENV === "development") {
        expect(console.error).toHaveBeenCalled();
      }
    });

    it("should update statistics in parallel for multiple dates", async () => {
      const start = new Date("2024-01-15T10:00:00Z");
      const end = new Date("2024-01-17T11:00:00Z"); // 3 days

      let callCount = 0;
      (calculateAndStoreDailyStatistics as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            callCount++;
            setTimeout(() => resolve({ id: `stats-${callCount}` }), 10);
          })
      );

      const startTime = Date.now();
      await updateStatisticsForBooking(clubId, start, end);
      const duration = Date.now() - startTime;

      // Should execute in parallel (< 100ms for 3 calls with 10ms delay each)
      expect(duration).toBeLessThan(100);
      expect(calculateAndStoreDailyStatistics).toHaveBeenCalledTimes(3);
    });

    it("should continue processing even if one date fails", async () => {
      const start = new Date("2024-01-15T10:00:00Z");
      const end = new Date("2024-01-17T11:00:00Z"); // 3 days

      let callCount = 0;
      (calculateAndStoreDailyStatistics as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return Promise.reject(new Error("Second date failed"));
        }
        return Promise.resolve({ id: `stats-${callCount}` });
      });

      // Should not throw even though one date fails
      await expect(
        updateStatisticsForBooking(clubId, start, end)
      ).resolves.not.toThrow();

      expect(calculateAndStoreDailyStatistics).toHaveBeenCalledTimes(3);
    });
  });

  describe("updateStatisticsForBookingChange", () => {
    const clubId = "club-456";

    it("should update statistics for both old and new dates when different", async () => {
      const oldStart = new Date("2024-01-15T10:00:00Z");
      const oldEnd = new Date("2024-01-15T11:00:00Z");
      const newStart = new Date("2024-01-16T14:00:00Z");
      const newEnd = new Date("2024-01-16T15:00:00Z");

      (calculateAndStoreDailyStatistics as jest.Mock).mockResolvedValue({
        id: "stats-1",
        clubId,
        bookedSlots: 5,
        totalSlots: 20,
        occupancyPercentage: 25,
      });

      await updateStatisticsForBookingChange(
        clubId,
        oldStart,
        oldEnd,
        newStart,
        newEnd
      );

      // Should be called for both dates (Jan 15 and Jan 16)
      expect(calculateAndStoreDailyStatistics).toHaveBeenCalledTimes(2);
    });

    it("should deduplicate dates when old and new overlap", async () => {
      const oldStart = new Date("2024-01-15T10:00:00Z");
      const oldEnd = new Date("2024-01-15T11:00:00Z");
      const newStart = new Date("2024-01-15T14:00:00Z");
      const newEnd = new Date("2024-01-15T15:00:00Z");

      (calculateAndStoreDailyStatistics as jest.Mock).mockResolvedValue({
        id: "stats-1",
        clubId,
        bookedSlots: 5,
        totalSlots: 20,
        occupancyPercentage: 25,
      });

      await updateStatisticsForBookingChange(
        clubId,
        oldStart,
        oldEnd,
        newStart,
        newEnd
      );

      // Should only be called once since both bookings are on the same day
      expect(calculateAndStoreDailyStatistics).toHaveBeenCalledTimes(1);
    });

    it("should handle multi-day bookings correctly", async () => {
      const oldStart = new Date("2024-01-15T10:00:00Z");
      const oldEnd = new Date("2024-01-16T11:00:00Z"); // 2 days
      const newStart = new Date("2024-01-17T14:00:00Z");
      const newEnd = new Date("2024-01-19T15:00:00Z"); // 3 days

      (calculateAndStoreDailyStatistics as jest.Mock).mockResolvedValue({
        id: "stats-1",
        clubId,
        bookedSlots: 5,
        totalSlots: 20,
        occupancyPercentage: 25,
      });

      await updateStatisticsForBookingChange(
        clubId,
        oldStart,
        oldEnd,
        newStart,
        newEnd
      );

      // Should be called for 5 unique dates (Jan 15, 16, 17, 18, 19)
      expect(calculateAndStoreDailyStatistics).toHaveBeenCalledTimes(5);
    });

    it("should handle errors without throwing", async () => {
      const oldStart = new Date("2024-01-15T10:00:00Z");
      const oldEnd = new Date("2024-01-15T11:00:00Z");
      const newStart = new Date("2024-01-16T14:00:00Z");
      const newEnd = new Date("2024-01-16T15:00:00Z");

      (calculateAndStoreDailyStatistics as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      // Should not throw
      await expect(
        updateStatisticsForBookingChange(clubId, oldStart, oldEnd, newStart, newEnd)
      ).resolves.not.toThrow();
    });

    it("should handle partial overlaps correctly", async () => {
      const oldStart = new Date("2024-01-15T10:00:00Z");
      const oldEnd = new Date("2024-01-17T11:00:00Z"); // Jan 15, 16, 17
      const newStart = new Date("2024-01-16T14:00:00Z");
      const newEnd = new Date("2024-01-18T15:00:00Z"); // Jan 16, 17, 18

      (calculateAndStoreDailyStatistics as jest.Mock).mockResolvedValue({
        id: "stats-1",
        clubId,
        bookedSlots: 5,
        totalSlots: 20,
        occupancyPercentage: 25,
      });

      await updateStatisticsForBookingChange(
        clubId,
        oldStart,
        oldEnd,
        newStart,
        newEnd
      );

      // Should be called for 4 unique dates (Jan 15, 16, 17, 18)
      expect(calculateAndStoreDailyStatistics).toHaveBeenCalledTimes(4);
    });
  });

  describe("Error handling and resilience", () => {
    it("should not propagate errors to caller", async () => {
      const clubId = "club-789";
      const start = new Date("2024-01-15T10:00:00Z");
      const end = new Date("2024-01-15T11:00:00Z");

      (calculateAndStoreDailyStatistics as jest.Mock).mockRejectedValue(
        new Error("Critical database error")
      );

      // Should resolve without throwing
      const promise = updateStatisticsForBooking(clubId, start, end);
      await expect(promise).resolves.toBeUndefined();
    });

    it("should handle network errors gracefully", async () => {
      const clubId = "club-network";
      const start = new Date("2024-01-15T10:00:00Z");
      const end = new Date("2024-01-15T11:00:00Z");

      (calculateAndStoreDailyStatistics as jest.Mock).mockRejectedValue(
        new Error("ECONNREFUSED")
      );

      await expect(
        updateStatisticsForBooking(clubId, start, end)
      ).resolves.not.toThrow();
    });
  });
});
