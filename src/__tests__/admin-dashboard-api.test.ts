/**
 * @jest-environment node
 */

jest.mock("@/lib/prisma", () => ({
  prisma: {
    club: {
      count: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
    booking: {
      count: jest.fn(),
    },
    membership: {
      findFirst: jest.fn(),
    },
    clubMembership: {
      findFirst: jest.fn(),
    },
  },
}));

const mockAuth = jest.fn();
jest.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

import { GET } from "@/app/api/admin/dashboard/route";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const mockClubCount = prisma.club.count as jest.Mock;
const mockUserCount = prisma.user.count as jest.Mock;
const mockBookingCount = prisma.booking.count as jest.Mock;
const mockMembershipFindFirst = prisma.membership.findFirst as jest.Mock;
const mockClubMembershipFindFirst = prisma.clubMembership.findFirst as jest.Mock;

describe("Admin Dashboard API", () => {
  const mockRequest = new NextRequest("http://localhost:3000/api/admin/dashboard");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/admin/dashboard", () => {
    it("should return 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 403 when user is not any type of admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "regular-user-1", isRoot: false },
      });
      mockMembershipFindFirst.mockResolvedValue(null);
      mockClubMembershipFindFirst.mockResolvedValue(null);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should return statistics for root admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "root-admin-1", isRoot: true },
      });
      mockClubCount.mockResolvedValue(5);
      mockUserCount.mockResolvedValue(100);
      mockBookingCount.mockResolvedValue(25);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        totalClubs: 5,
        totalUsers: 100,
        activeBookings: 25,
      });
    });

    it("should return statistics for organization admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "org-admin-1", isRoot: false },
      });
      mockMembershipFindFirst.mockResolvedValue({
        id: "membership-1",
        userId: "org-admin-1",
        role: "ORGANIZATION_ADMIN",
      });
      mockClubCount.mockResolvedValue(3);
      mockUserCount.mockResolvedValue(50);
      mockBookingCount.mockResolvedValue(10);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        totalClubs: 3,
        totalUsers: 50,
        activeBookings: 10,
      });
    });

    it("should return statistics for club admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "club-admin-1", isRoot: false },
      });
      mockMembershipFindFirst.mockResolvedValue(null);
      mockClubMembershipFindFirst.mockResolvedValue({
        id: "club-membership-1",
        userId: "club-admin-1",
        role: "CLUB_ADMIN",
      });
      mockClubCount.mockResolvedValue(1);
      mockUserCount.mockResolvedValue(20);
      mockBookingCount.mockResolvedValue(5);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        totalClubs: 1,
        totalUsers: 20,
        activeBookings: 5,
      });
    });

    it("should only count pending and paid bookings as active", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "root-admin-1", isRoot: true },
      });
      mockClubCount.mockResolvedValue(0);
      mockUserCount.mockResolvedValue(0);
      mockBookingCount.mockResolvedValue(10);

      await GET(mockRequest);

      expect(mockBookingCount).toHaveBeenCalledWith({
        where: {
          status: {
            in: ["pending", "paid"],
          },
        },
      });
    });

    it("should handle database errors gracefully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "root-admin-1", isRoot: true },
      });
      mockClubCount.mockRejectedValue(new Error("Database error"));

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });
});
