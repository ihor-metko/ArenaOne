/**
 * Tests for Calculate Daily Statistics Cron Job
 */

import { GET, POST } from "@/app/api/cron/calculate-daily-statistics/route";
import { calculateDailyStatisticsForAllClubs } from "@/services/statisticsService";

// Mock dependencies
jest.mock("@/services/statisticsService");

describe("Calculate Daily Statistics Cron", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("POST /api/cron/calculate-daily-statistics", () => {
    it("should allow access without CRON_SECRET in development", async () => {
      delete process.env.CRON_SECRET;

      (calculateDailyStatisticsForAllClubs as jest.Mock).mockResolvedValue([]);

      const request = new Request(
        "http://localhost/api/cron/calculate-daily-statistics",
        { method: "POST" }
      );
      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it("should return 401 without valid CRON_SECRET", async () => {
      process.env.CRON_SECRET = "a".repeat(32); // Valid length secret

      const request = new Request(
        "http://localhost/api/cron/calculate-daily-statistics",
        { method: "POST" }
      );
      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should allow access with valid CRON_SECRET", async () => {
      const secret = "a".repeat(32);
      process.env.CRON_SECRET = secret;

      (calculateDailyStatisticsForAllClubs as jest.Mock).mockResolvedValue([]);

      const request = new Request(
        "http://localhost/api/cron/calculate-daily-statistics",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secret}`,
          },
        }
      );
      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it("should calculate statistics for all clubs", async () => {
      delete process.env.CRON_SECRET;

      const mockResults = [
        {
          clubId: "club-1",
          clubName: "Club 1",
          success: true,
          statistics: {
            id: "stat-1",
            bookedSlots: 10,
            totalSlots: 50,
            occupancyPercentage: 20.0,
          },
        },
        {
          clubId: "club-2",
          clubName: "Club 2",
          success: true,
          statistics: {
            id: "stat-2",
            bookedSlots: 30,
            totalSlots: 60,
            occupancyPercentage: 50.0,
          },
        },
      ];

      (calculateDailyStatisticsForAllClubs as jest.Mock).mockResolvedValue(
        mockResults
      );

      const request = new Request(
        "http://localhost/api/cron/calculate-daily-statistics",
        { method: "POST" }
      );
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.totalClubs).toBe(2);
      expect(data.successCount).toBe(2);
      expect(data.failureCount).toBe(0);
      expect(data.results).toEqual(mockResults);
    });

    it("should handle partial failures", async () => {
      delete process.env.CRON_SECRET;

      const mockResults = [
        {
          clubId: "club-1",
          clubName: "Club 1",
          success: true,
          statistics: { id: "stat-1" },
        },
        {
          clubId: "club-2",
          clubName: "Club 2",
          success: false,
          error: "Calculation failed",
        },
      ];

      (calculateDailyStatisticsForAllClubs as jest.Mock).mockResolvedValue(
        mockResults
      );

      const request = new Request(
        "http://localhost/api/cron/calculate-daily-statistics",
        { method: "POST" }
      );
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.successCount).toBe(1);
      expect(data.failureCount).toBe(1);
    });

    it("should use yesterday as default date", async () => {
      delete process.env.CRON_SECRET;

      (calculateDailyStatisticsForAllClubs as jest.Mock).mockResolvedValue([]);

      const request = new Request(
        "http://localhost/api/cron/calculate-daily-statistics",
        { method: "POST" }
      );
      await POST(request);

      const callArgs = (calculateDailyStatisticsForAllClubs as jest.Mock).mock
        .calls[0];
      const passedDate = callArgs[0];

      // Check that the date is approximately yesterday
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(passedDate.getDate()).toBe(yesterday.getDate());
    });

    it("should accept custom date parameter", async () => {
      delete process.env.CRON_SECRET;

      (calculateDailyStatisticsForAllClubs as jest.Mock).mockResolvedValue([]);

      const request = new Request(
        "http://localhost/api/cron/calculate-daily-statistics?date=2024-01-15",
        { method: "POST" }
      );
      await POST(request);

      const callArgs = (calculateDailyStatisticsForAllClubs as jest.Mock).mock
        .calls[0];
      const passedDate = callArgs[0];

      expect(passedDate.getFullYear()).toBe(2024);
      expect(passedDate.getMonth()).toBe(0); // January
      expect(passedDate.getDate()).toBe(15);
    });

    it("should return 400 for invalid date format", async () => {
      delete process.env.CRON_SECRET;

      const request = new Request(
        "http://localhost/api/cron/calculate-daily-statistics?date=invalid-date",
        { method: "POST" }
      );
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Invalid date format");
    });

    it("should handle service errors gracefully", async () => {
      delete process.env.CRON_SECRET;

      (calculateDailyStatisticsForAllClubs as jest.Mock).mockRejectedValue(
        new Error("Database connection failed")
      );

      const request = new Request(
        "http://localhost/api/cron/calculate-daily-statistics",
        { method: "POST" }
      );
      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Internal server error");
      expect(data.message).toBe("Database connection failed");
    });
  });

  describe("GET /api/cron/calculate-daily-statistics", () => {
    it("should return health status", async () => {
      delete process.env.CRON_SECRET;

      const request = new Request(
        "http://localhost/api/cron/calculate-daily-statistics"
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe("healthy");
      expect(data.endpoint).toBe("/api/cron/calculate-daily-statistics");
    });

    it("should return 401 without valid CRON_SECRET", async () => {
      process.env.CRON_SECRET = "a".repeat(32);

      const request = new Request(
        "http://localhost/api/cron/calculate-daily-statistics"
      );
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it("should allow access with valid CRON_SECRET", async () => {
      const secret = "a".repeat(32);
      process.env.CRON_SECRET = secret;

      const request = new Request(
        "http://localhost/api/cron/calculate-daily-statistics",
        {
          headers: {
            Authorization: `Bearer ${secret}`,
          },
        }
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });
});
