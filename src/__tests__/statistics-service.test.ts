/**
 * Tests for Statistics Service
 * 
 * Tests calculation logic for daily and monthly statistics
 */

import { 
  calculateTotalSlots, 
  calculateBookedSlots,
  calculateAndStoreDailyStatistics,
  calculateAverageOccupancyForMonth,
  getOrCalculateMonthlyStatistics,
} from "@/services/statisticsService";
import { prisma } from "@/lib/prisma";

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    court: {
      findMany: jest.fn(),
    },
    clubSpecialHours: {
      findUnique: jest.fn(),
    },
    clubBusinessHours: {
      findUnique: jest.fn(),
    },
    booking: {
      findMany: jest.fn(),
    },
    clubDailyStatistics: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    clubMonthlyStatistics: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe("Statistics Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("calculateTotalSlots", () => {
    const clubId = "club-123";
    const date = new Date("2024-01-15"); // Monday

    it("should return 0 when club has no active courts", async () => {
      (prisma.court.findMany as jest.Mock).mockResolvedValue([]);

      const result = await calculateTotalSlots(clubId, date);

      expect(result).toBe(0);
    });

    it("should return 0 when club is closed on special hours", async () => {
      (prisma.court.findMany as jest.Mock).mockResolvedValue([
        { id: "court-1" },
        { id: "court-2" },
      ]);
      (prisma.clubSpecialHours.findUnique as jest.Mock).mockResolvedValue({
        isClosed: true,
      });

      const result = await calculateTotalSlots(clubId, date);

      expect(result).toBe(0);
    });

    it("should return 0 when club is closed on regular business hours", async () => {
      (prisma.court.findMany as jest.Mock).mockResolvedValue([
        { id: "court-1" },
      ]);
      (prisma.clubSpecialHours.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.clubBusinessHours.findUnique as jest.Mock).mockResolvedValue({
        isClosed: true,
      });

      const result = await calculateTotalSlots(clubId, date);

      expect(result).toBe(0);
    });

    it("should calculate slots correctly with regular business hours", async () => {
      (prisma.court.findMany as jest.Mock).mockResolvedValue([
        { id: "court-1" },
        { id: "court-2" },
      ]);
      (prisma.clubSpecialHours.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.clubBusinessHours.findUnique as jest.Mock).mockResolvedValue({
        isClosed: false,
        openTime: "08:00",
        closeTime: "22:00", // 14 hours
      });

      const result = await calculateTotalSlots(clubId, date);

      // 2 courts × 14 hours = 28 slots
      expect(result).toBe(28);
    });

    it("should use special hours when available", async () => {
      (prisma.court.findMany as jest.Mock).mockResolvedValue([
        { id: "court-1" },
        { id: "court-2" },
        { id: "court-3" },
      ]);
      (prisma.clubSpecialHours.findUnique as jest.Mock).mockResolvedValue({
        isClosed: false,
        openTime: "10:00",
        closeTime: "18:00", // 8 hours
      });

      const result = await calculateTotalSlots(clubId, date);

      // 3 courts × 8 hours = 24 slots
      expect(result).toBe(24);
    });

    it("should return 0 when no hours are defined", async () => {
      (prisma.court.findMany as jest.Mock).mockResolvedValue([
        { id: "court-1" },
      ]);
      (prisma.clubSpecialHours.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.clubBusinessHours.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await calculateTotalSlots(clubId, date);

      expect(result).toBe(0);
    });
  });

  describe("calculateBookedSlots", () => {
    const clubId = "club-123";
    const date = new Date("2024-01-15");

    it("should return 0 when there are no bookings", async () => {
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);

      const result = await calculateBookedSlots(clubId, date);

      expect(result).toBe(0);
    });

    it("should count bookings correctly", async () => {
      const baseDate = new Date("2024-01-15T10:00:00");
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([
        {
          start: new Date("2024-01-15T10:00:00"),
          end: new Date("2024-01-15T11:00:00"), // 1 hour
        },
        {
          start: new Date("2024-01-15T14:00:00"),
          end: new Date("2024-01-15T16:00:00"), // 2 hours
        },
        {
          start: new Date("2024-01-15T18:00:00"),
          end: new Date("2024-01-15T19:00:00"), // 1 hour
        },
      ]);

      const result = await calculateBookedSlots(clubId, date);

      // 1 + 2 + 1 = 4 hours
      expect(result).toBe(4);
    });

    it("should filter cancelled bookings", async () => {
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([
        {
          start: new Date("2024-01-15T10:00:00"),
          end: new Date("2024-01-15T11:00:00"),
        },
      ]);

      await calculateBookedSlots(clubId, date);

      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            bookingStatus: {
              not: "Cancelled",
            },
          }),
        })
      );
    });

    it("should handle half-hour bookings correctly", async () => {
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([
        {
          start: new Date("2024-01-15T10:00:00"),
          end: new Date("2024-01-15T10:30:00"), // 0.5 hour
        },
        {
          start: new Date("2024-01-15T14:00:00"),
          end: new Date("2024-01-15T15:30:00"), // 1.5 hours
        },
      ]);

      const result = await calculateBookedSlots(clubId, date);

      // 0.5 + 1.5 = 2 hours (rounded)
      expect(result).toBe(2);
    });
  });

  describe("calculateAndStoreDailyStatistics", () => {
    const clubId = "club-123";
    const date = new Date("2024-01-15");

    beforeEach(() => {
      // Setup default mocks
      (prisma.court.findMany as jest.Mock).mockResolvedValue([
        { id: "court-1" },
        { id: "court-2" },
      ]);
      (prisma.clubSpecialHours.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.clubBusinessHours.findUnique as jest.Mock).mockResolvedValue({
        isClosed: false,
        openTime: "08:00",
        closeTime: "22:00", // 14 hours
      });
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([
        {
          start: new Date("2024-01-15T10:00:00"),
          end: new Date("2024-01-15T11:00:00"), // 1 hour
        },
        {
          start: new Date("2024-01-15T14:00:00"),
          end: new Date("2024-01-15T16:00:00"), // 2 hours
        },
      ]);
      (prisma.clubDailyStatistics.upsert as jest.Mock).mockResolvedValue({
        id: "stats-123",
        clubId,
        date,
        bookedSlots: 3,
        totalSlots: 28,
        occupancyPercentage: 10.71,
      });
    });

    it("should calculate and store daily statistics", async () => {
      const result = await calculateAndStoreDailyStatistics(clubId, date);

      expect(prisma.clubDailyStatistics.upsert).toHaveBeenCalledWith({
        where: {
          clubId_date: {
            clubId,
            date: expect.any(Date),
          },
        },
        update: expect.objectContaining({
          bookedSlots: 3,
          totalSlots: 28,
        }),
        create: expect.objectContaining({
          clubId,
          bookedSlots: 3,
          totalSlots: 28,
        }),
      });

      expect(result).toBeDefined();
      expect(result.clubId).toBe(clubId);
    });

    it("should handle 0 total slots correctly", async () => {
      (prisma.court.findMany as jest.Mock).mockResolvedValue([]);

      await calculateAndStoreDailyStatistics(clubId, date);

      expect(prisma.clubDailyStatistics.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            occupancyPercentage: 0,
          }),
        })
      );
    });

    it("should calculate occupancy percentage correctly", async () => {
      // 3 booked out of 28 total = 10.71%
      await calculateAndStoreDailyStatistics(clubId, date);

      const updateData = (prisma.clubDailyStatistics.upsert as jest.Mock).mock
        .calls[0][0].update;

      expect(updateData.occupancyPercentage).toBeCloseTo(10.71, 2);
    });
  });

  describe("calculateAverageOccupancyForMonth", () => {
    const clubId = "club-123";
    const month = 1; // January
    const year = 2024;

    it("should return null when no daily statistics exist", async () => {
      (prisma.clubDailyStatistics.findMany as jest.Mock).mockResolvedValue([]);

      const result = await calculateAverageOccupancyForMonth(clubId, month, year);

      expect(result).toBeNull();
    });

    it("should calculate average occupancy correctly", async () => {
      (prisma.clubDailyStatistics.findMany as jest.Mock).mockResolvedValue([
        { occupancyPercentage: 20.0 },
        { occupancyPercentage: 30.0 },
        { occupancyPercentage: 40.0 },
        { occupancyPercentage: 50.0 },
      ]);

      const result = await calculateAverageOccupancyForMonth(clubId, month, year);

      // (20 + 30 + 40 + 50) / 4 = 35
      expect(result).toBe(35.0);
    });

    it("should query the correct date range", async () => {
      (prisma.clubDailyStatistics.findMany as jest.Mock).mockResolvedValue([]);

      await calculateAverageOccupancyForMonth(clubId, month, year);

      expect(prisma.clubDailyStatistics.findMany).toHaveBeenCalledWith({
        where: {
          clubId,
          date: {
            gte: new Date(2024, 0, 1), // Jan 1
            lte: expect.any(Date), // Last day of Jan
          },
        },
        select: {
          occupancyPercentage: true,
        },
      });
    });
  });

  describe("getOrCalculateMonthlyStatistics", () => {
    const clubId = "club-123";
    const month = 2; // February
    const year = 2024;

    it("should return existing statistics if available", async () => {
      const existingStats = {
        id: "stats-123",
        clubId,
        month,
        year,
        averageOccupancy: 45.5,
        previousMonthOccupancy: 40.0,
        occupancyChangePercent: 13.75,
      };

      (prisma.clubMonthlyStatistics.findUnique as jest.Mock).mockResolvedValue(
        existingStats
      );

      const result = await getOrCalculateMonthlyStatistics(clubId, month, year);

      expect(result).toEqual(existingStats);
      expect(prisma.clubMonthlyStatistics.create).not.toHaveBeenCalled();
    });

    it("should calculate and store new statistics if missing", async () => {
      (prisma.clubMonthlyStatistics.findUnique as jest.Mock).mockResolvedValue(
        null
      );
      
      // Mock current month occupancy
      (prisma.clubDailyStatistics.findMany as jest.Mock)
        .mockResolvedValueOnce([
          { occupancyPercentage: 50.0 },
          { occupancyPercentage: 60.0 },
        ])
        // Mock previous month occupancy
        .mockResolvedValueOnce([
          { occupancyPercentage: 40.0 },
          { occupancyPercentage: 50.0 },
        ]);

      (prisma.clubMonthlyStatistics.create as jest.Mock).mockResolvedValue({
        id: "new-stats",
        clubId,
        month,
        year,
        averageOccupancy: 55.0,
        previousMonthOccupancy: 45.0,
        occupancyChangePercent: 22.22,
      });

      const result = await getOrCalculateMonthlyStatistics(clubId, month, year);

      expect(prisma.clubMonthlyStatistics.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should return null when no daily data available", async () => {
      (prisma.clubMonthlyStatistics.findUnique as jest.Mock).mockResolvedValue(
        null
      );
      (prisma.clubDailyStatistics.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getOrCalculateMonthlyStatistics(clubId, month, year);

      expect(result).toBeNull();
      expect(prisma.clubMonthlyStatistics.create).not.toHaveBeenCalled();
    });

    it("should calculate change percentage correctly", async () => {
      (prisma.clubMonthlyStatistics.findUnique as jest.Mock).mockResolvedValue(
        null
      );
      
      // Current month: 60% occupancy
      (prisma.clubDailyStatistics.findMany as jest.Mock)
        .mockResolvedValueOnce([{ occupancyPercentage: 60.0 }])
        // Previous month: 50% occupancy
        .mockResolvedValueOnce([{ occupancyPercentage: 50.0 }]);

      (prisma.clubMonthlyStatistics.create as jest.Mock).mockImplementation(
        (data) => Promise.resolve(data.data)
      );

      await getOrCalculateMonthlyStatistics(clubId, month, year);

      const createCall = (prisma.clubMonthlyStatistics.create as jest.Mock).mock
        .calls[0][0];

      // (60 - 50) / 50 * 100 = 20%
      expect(createCall.data.occupancyChangePercent).toBe(20);
    });

    it("should handle 100% increase when previous month was 0", async () => {
      (prisma.clubMonthlyStatistics.findUnique as jest.Mock).mockResolvedValue(
        null
      );
      
      (prisma.clubDailyStatistics.findMany as jest.Mock)
        .mockResolvedValueOnce([{ occupancyPercentage: 30.0 }])
        .mockResolvedValueOnce([{ occupancyPercentage: 0.0 }]);

      (prisma.clubMonthlyStatistics.create as jest.Mock).mockImplementation(
        (data) => Promise.resolve(data.data)
      );

      await getOrCalculateMonthlyStatistics(clubId, month, year);

      const createCall = (prisma.clubMonthlyStatistics.create as jest.Mock).mock
        .calls[0][0];

      expect(createCall.data.occupancyChangePercent).toBe(100);
    });

    it("should handle no previous month data", async () => {
      (prisma.clubMonthlyStatistics.findUnique as jest.Mock).mockResolvedValue(
        null
      );
      
      (prisma.clubDailyStatistics.findMany as jest.Mock)
        .mockResolvedValueOnce([{ occupancyPercentage: 50.0 }])
        .mockResolvedValueOnce([]); // No previous month data

      (prisma.clubMonthlyStatistics.create as jest.Mock).mockImplementation(
        (data) => Promise.resolve(data.data)
      );

      await getOrCalculateMonthlyStatistics(clubId, month, year);

      const createCall = (prisma.clubMonthlyStatistics.create as jest.Mock).mock
        .calls[0][0];

      expect(createCall.data.previousMonthOccupancy).toBeNull();
      expect(createCall.data.occupancyChangePercent).toBeNull();
    });
  });
});
