/**
 * Tests for Monthly Statistics API with Lazy Calculation
 */

import { GET } from "@/app/api/admin/statistics/monthly/route";
import { prisma } from "@/lib/prisma";
import { requireAnyAdmin } from "@/lib/requireRole";
import {
  getOrCalculateMonthlyStatistics,
  getOrganizationMonthlyStatistics,
} from "@/services/statisticsService";

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    clubMonthlyStatistics: {
      findMany: jest.fn(),
    },
    club: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@/lib/requireRole");
jest.mock("@/services/statisticsService");

describe("Monthly Statistics API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/admin/statistics/monthly", () => {
    it("should return 401 for unauthorized users", async () => {
      (requireAnyAdmin as jest.Mock).mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        }),
      });

      const request = new Request(
        "http://localhost/api/admin/statistics/monthly"
      );
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it("should return existing statistics in standard mode", async () => {
      (requireAnyAdmin as jest.Mock).mockResolvedValue({
        authorized: true,
        adminType: "root",
        managedIds: [],
      });

      const mockStats = [
        {
          id: "stat-1",
          clubId: "club-1",
          month: 1,
          year: 2024,
          averageOccupancy: 45.5,
          previousMonthOccupancy: 40.0,
          occupancyChangePercent: 13.75,
          club: { id: "club-1", name: "Test Club" },
        },
      ];

      (prisma.clubMonthlyStatistics.findMany as jest.Mock).mockResolvedValue(
        mockStats
      );

      const request = new Request(
        "http://localhost/api/admin/statistics/monthly"
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockStats);
    });

    it("should trigger lazy calculation for specific club", async () => {
      (requireAnyAdmin as jest.Mock).mockResolvedValue({
        authorized: true,
        adminType: "root",
        managedIds: [],
      });

      const mockStats = {
        id: "stat-1",
        clubId: "club-1",
        month: 1,
        year: 2024,
        averageOccupancy: 45.5,
        previousMonthOccupancy: 40.0,
        occupancyChangePercent: 13.75,
      };

      (getOrCalculateMonthlyStatistics as jest.Mock).mockResolvedValue(
        mockStats
      );

      const request = new Request(
        "http://localhost/api/admin/statistics/monthly?clubId=club-1&month=1&year=2024&lazyCalculate=true"
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(getOrCalculateMonthlyStatistics).toHaveBeenCalledWith(
        "club-1",
        1,
        2024
      );
      const data = await response.json();
      expect(data).toEqual(mockStats);
    });

    it("should return 404 when lazy calculation has no data", async () => {
      (requireAnyAdmin as jest.Mock).mockResolvedValue({
        authorized: true,
        adminType: "root",
        managedIds: [],
      });

      (getOrCalculateMonthlyStatistics as jest.Mock).mockResolvedValue(null);

      const request = new Request(
        "http://localhost/api/admin/statistics/monthly?clubId=club-1&month=1&year=2024&lazyCalculate=true"
      );
      const response = await GET(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain("No daily statistics available");
    });

    it("should validate month range in lazy mode", async () => {
      (requireAnyAdmin as jest.Mock).mockResolvedValue({
        authorized: true,
        adminType: "root",
        managedIds: [],
      });

      const request = new Request(
        "http://localhost/api/admin/statistics/monthly?clubId=club-1&month=13&year=2024&lazyCalculate=true"
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Month must be between 1 and 12");
    });

    it("should check permissions for club admin in lazy mode", async () => {
      (requireAnyAdmin as jest.Mock).mockResolvedValue({
        authorized: true,
        adminType: "club_admin",
        managedIds: ["club-2"],
      });

      const request = new Request(
        "http://localhost/api/admin/statistics/monthly?clubId=club-1&month=1&year=2024&lazyCalculate=true"
      );
      const response = await GET(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain("You do not have permission");
    });

    it("should check permissions for organization admin in lazy mode", async () => {
      (requireAnyAdmin as jest.Mock).mockResolvedValue({
        authorized: true,
        adminType: "organization_admin",
        managedIds: ["org-1"],
      });

      (prisma.club.findUnique as jest.Mock).mockResolvedValue({
        organizationId: "org-2",
      });

      const request = new Request(
        "http://localhost/api/admin/statistics/monthly?clubId=club-1&month=1&year=2024&lazyCalculate=true"
      );
      const response = await GET(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain("You do not have permission");
    });

    it("should trigger lazy calculation for organization", async () => {
      (requireAnyAdmin as jest.Mock).mockResolvedValue({
        authorized: true,
        adminType: "organization_admin",
        managedIds: ["org-1"],
      });

      const mockStats = [
        {
          clubId: "club-1",
          clubName: "Club 1",
          statistics: {
            id: "stat-1",
            averageOccupancy: 45.5,
          },
        },
        {
          clubId: "club-2",
          clubName: "Club 2",
          statistics: {
            id: "stat-2",
            averageOccupancy: 50.0,
          },
        },
      ];

      (getOrganizationMonthlyStatistics as jest.Mock).mockResolvedValue(
        mockStats
      );

      const request = new Request(
        "http://localhost/api/admin/statistics/monthly?organizationId=org-1&month=1&year=2024&lazyCalculate=true"
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(getOrganizationMonthlyStatistics).toHaveBeenCalledWith(
        "org-1",
        1,
        2024
      );
      const data = await response.json();
      expect(data).toEqual(mockStats);
    });

    it("should deny club admin access to organization statistics", async () => {
      (requireAnyAdmin as jest.Mock).mockResolvedValue({
        authorized: true,
        adminType: "club_admin",
        managedIds: ["club-1"],
      });

      const request = new Request(
        "http://localhost/api/admin/statistics/monthly?organizationId=org-1&month=1&year=2024&lazyCalculate=true"
      );
      const response = await GET(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain(
        "You do not have permission to access organization-level statistics"
      );
    });

    it("should check organization permissions in lazy mode", async () => {
      (requireAnyAdmin as jest.Mock).mockResolvedValue({
        authorized: true,
        adminType: "organization_admin",
        managedIds: ["org-2"],
      });

      const request = new Request(
        "http://localhost/api/admin/statistics/monthly?organizationId=org-1&month=1&year=2024&lazyCalculate=true"
      );
      const response = await GET(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain("You do not have permission");
    });

    it("should filter by clubId in standard mode", async () => {
      (requireAnyAdmin as jest.Mock).mockResolvedValue({
        authorized: true,
        adminType: "root",
        managedIds: [],
      });

      (prisma.clubMonthlyStatistics.findMany as jest.Mock).mockResolvedValue(
        []
      );

      const request = new Request(
        "http://localhost/api/admin/statistics/monthly?clubId=club-1"
      );
      await GET(request);

      expect(prisma.clubMonthlyStatistics.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clubId: "club-1",
          }),
        })
      );
    });

    it("should filter by month and year in standard mode", async () => {
      (requireAnyAdmin as jest.Mock).mockResolvedValue({
        authorized: true,
        adminType: "root",
        managedIds: [],
      });

      (prisma.clubMonthlyStatistics.findMany as jest.Mock).mockResolvedValue(
        []
      );

      const request = new Request(
        "http://localhost/api/admin/statistics/monthly?month=1&year=2024"
      );
      await GET(request);

      expect(prisma.clubMonthlyStatistics.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            month: 1,
            year: 2024,
          }),
        })
      );
    });

    it("should restrict club admin to their clubs in standard mode", async () => {
      (requireAnyAdmin as jest.Mock).mockResolvedValue({
        authorized: true,
        adminType: "club_admin",
        managedIds: ["club-1", "club-2"],
      });

      (prisma.clubMonthlyStatistics.findMany as jest.Mock).mockResolvedValue(
        []
      );

      const request = new Request(
        "http://localhost/api/admin/statistics/monthly"
      );
      await GET(request);

      expect(prisma.clubMonthlyStatistics.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clubId: { in: ["club-1", "club-2"] },
          }),
        })
      );
    });
  });
});
