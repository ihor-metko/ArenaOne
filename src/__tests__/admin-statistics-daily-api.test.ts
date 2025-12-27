/**
 * Tests for Daily Statistics API
 */

import { GET, POST } from "@/app/api/admin/statistics/daily/route";
import { prisma } from "@/lib/prisma";
import { requireAnyAdmin } from "@/lib/requireRole";
import { calculateAndStoreDailyStatistics } from "@/services/statisticsService";

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    clubDailyStatistics: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    club: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@/lib/requireRole");
jest.mock("@/services/statisticsService");

describe("Daily Statistics API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/admin/statistics/daily", () => {
    it("should return 401 for unauthorized users", async () => {
      (requireAnyAdmin as jest.Mock).mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        }),
      });

      const request = new Request("http://localhost/api/admin/statistics/daily");
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it("should return statistics for root admin", async () => {
      (requireAnyAdmin as jest.Mock).mockResolvedValue({
        authorized: true,
        adminType: "root",
        managedIds: [],
      });

      const mockStats = [
        {
          id: "stat-1",
          clubId: "club-1",
          date: new Date("2024-01-15"),
          bookedSlots: 20,
          totalSlots: 50,
          occupancyPercentage: 40.0,
          club: { id: "club-1", name: "Test Club" },
        },
      ];

      (prisma.clubDailyStatistics.findMany as jest.Mock).mockResolvedValue(
        mockStats
      );

      const request = new Request("http://localhost/api/admin/statistics/daily");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockStats);
    });

    it("should filter statistics by clubId", async () => {
      (requireAnyAdmin as jest.Mock).mockResolvedValue({
        authorized: true,
        adminType: "root",
        managedIds: [],
      });

      (prisma.clubDailyStatistics.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request(
        "http://localhost/api/admin/statistics/daily?clubId=club-123"
      );
      await GET(request);

      expect(prisma.clubDailyStatistics.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clubId: "club-123",
          }),
        })
      );
    });

    it("should filter statistics by date range", async () => {
      (requireAnyAdmin as jest.Mock).mockResolvedValue({
        authorized: true,
        adminType: "root",
        managedIds: [],
      });

      (prisma.clubDailyStatistics.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request(
        "http://localhost/api/admin/statistics/daily?startDate=2024-01-01&endDate=2024-01-31"
      );
      await GET(request);

      expect(prisma.clubDailyStatistics.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: {
              gte: new Date("2024-01-01"),
              lte: new Date("2024-01-31"),
            },
          }),
        })
      );
    });

    it("should restrict club admin to their clubs", async () => {
      (requireAnyAdmin as jest.Mock).mockResolvedValue({
        authorized: true,
        adminType: "club_admin",
        managedIds: ["club-1", "club-2"],
      });

      (prisma.clubDailyStatistics.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request("http://localhost/api/admin/statistics/daily");
      await GET(request);

      expect(prisma.clubDailyStatistics.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clubId: { in: ["club-1", "club-2"] },
          }),
        })
      );
    });

    it("should restrict organization admin to their organization's clubs", async () => {
      (requireAnyAdmin as jest.Mock).mockResolvedValue({
        authorized: true,
        adminType: "organization_admin",
        managedIds: ["org-1"],
      });

      (prisma.clubDailyStatistics.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request("http://localhost/api/admin/statistics/daily");
      await GET(request);

      expect(prisma.clubDailyStatistics.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            club: {
              organizationId: { in: ["org-1"] },
            },
          }),
        })
      );
    });
  });

  describe("POST /api/admin/statistics/daily", () => {
    it("should return 401 for unauthorized users", async () => {
      (requireAnyAdmin as jest.Mock).mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        }),
      });

      const request = new Request(
        "http://localhost/api/admin/statistics/daily",
        {
          method: "POST",
          body: JSON.stringify({
            clubId: "club-1",
            date: "2024-01-15",
          }),
        }
      );
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it("should validate required fields", async () => {
      (requireAnyAdmin as jest.Mock).mockResolvedValue({
        authorized: true,
        adminType: "root",
        managedIds: [],
      });

      const request = new Request(
        "http://localhost/api/admin/statistics/daily",
        {
          method: "POST",
          body: JSON.stringify({}),
        }
      );
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Missing required fields");
    });

    it("should use auto-calculation when manual values not provided", async () => {
      (requireAnyAdmin as jest.Mock).mockResolvedValue({
        authorized: true,
        adminType: "root",
        managedIds: [],
      });

      const mockStats = {
        id: "stat-1",
        clubId: "club-1",
        date: new Date("2024-01-15"),
        bookedSlots: 10,
        totalSlots: 50,
        occupancyPercentage: 20.0,
      };

      (calculateAndStoreDailyStatistics as jest.Mock).mockResolvedValue(
        mockStats
      );

      const request = new Request(
        "http://localhost/api/admin/statistics/daily",
        {
          method: "POST",
          body: JSON.stringify({
            clubId: "club-1",
            date: "2024-01-15",
          }),
        }
      );
      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(calculateAndStoreDailyStatistics).toHaveBeenCalledWith(
        "club-1",
        expect.any(Date)
      );
    });

    it("should use manual values when provided", async () => {
      (requireAnyAdmin as jest.Mock).mockResolvedValue({
        authorized: true,
        adminType: "root",
        managedIds: [],
      });

      const mockStats = {
        id: "stat-1",
        clubId: "club-1",
        date: new Date("2024-01-15"),
        bookedSlots: 25,
        totalSlots: 50,
        occupancyPercentage: 50.0,
      };

      (prisma.clubDailyStatistics.upsert as jest.Mock).mockResolvedValue(
        mockStats
      );

      const request = new Request(
        "http://localhost/api/admin/statistics/daily",
        {
          method: "POST",
          body: JSON.stringify({
            clubId: "club-1",
            date: "2024-01-15",
            bookedSlots: 25,
            totalSlots: 50,
          }),
        }
      );
      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(prisma.clubDailyStatistics.upsert).toHaveBeenCalled();
      expect(calculateAndStoreDailyStatistics).not.toHaveBeenCalled();
    });

    it("should validate that bookedSlots does not exceed totalSlots", async () => {
      (requireAnyAdmin as jest.Mock).mockResolvedValue({
        authorized: true,
        adminType: "root",
        managedIds: [],
      });

      const request = new Request(
        "http://localhost/api/admin/statistics/daily",
        {
          method: "POST",
          body: JSON.stringify({
            clubId: "club-1",
            date: "2024-01-15",
            bookedSlots: 60,
            totalSlots: 50,
          }),
        }
      );
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("bookedSlots cannot exceed totalSlots");
    });

    it("should validate that totalSlots is greater than zero", async () => {
      (requireAnyAdmin as jest.Mock).mockResolvedValue({
        authorized: true,
        adminType: "root",
        managedIds: [],
      });

      const request = new Request(
        "http://localhost/api/admin/statistics/daily",
        {
          method: "POST",
          body: JSON.stringify({
            clubId: "club-1",
            date: "2024-01-15",
            bookedSlots: 0,
            totalSlots: 0,
          }),
        }
      );
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("totalSlots must be greater than zero");
    });

    it("should check permissions for club admin", async () => {
      (requireAnyAdmin as jest.Mock).mockResolvedValue({
        authorized: true,
        adminType: "club_admin",
        managedIds: ["club-2"],
      });

      const request = new Request(
        "http://localhost/api/admin/statistics/daily",
        {
          method: "POST",
          body: JSON.stringify({
            clubId: "club-1",
            date: "2024-01-15",
          }),
        }
      );
      const response = await POST(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain("You do not have permission");
    });

    it("should check permissions for organization admin", async () => {
      (requireAnyAdmin as jest.Mock).mockResolvedValue({
        authorized: true,
        adminType: "organization_admin",
        managedIds: ["org-1"],
      });

      (prisma.club.findUnique as jest.Mock).mockResolvedValue({
        organizationId: "org-2",
      });

      const request = new Request(
        "http://localhost/api/admin/statistics/daily",
        {
          method: "POST",
          body: JSON.stringify({
            clubId: "club-1",
            date: "2024-01-15",
          }),
        }
      );
      const response = await POST(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain("You do not have permission");
    });
  });
});
