/**
 * @jest-environment node
 */

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    membership: {
      findFirst: jest.fn(),
    },
    clubMembership: {
      findFirst: jest.fn(),
    },
  },
}));

// Mock auth function
const mockAuth = jest.fn();
jest.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

import { GET } from "@/app/api/admin/check-access/route";
import { prisma } from "@/lib/prisma";

const mockMembershipFindFirst = prisma.membership.findFirst as jest.Mock;
const mockClubMembershipFindFirst = prisma.clubMembership.findFirst as jest.Mock;

describe("Admin Check Access API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/admin/check-access", () => {
    it("should return 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return isAdmin: true for root admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "root-admin-1", isRoot: true },
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isAdmin).toBe(true);
      expect(data.adminType).toBe("root");
    });

    it("should return isAdmin: true for organization admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "org-admin-1", isRoot: false },
      });
      mockMembershipFindFirst.mockResolvedValue({
        id: "membership-1",
        userId: "org-admin-1",
        role: "ORGANIZATION_ADMIN",
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isAdmin).toBe(true);
      expect(data.adminType).toBe("organization");
    });

    it("should return isAdmin: true for club admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "club-admin-1", isRoot: false },
      });
      mockMembershipFindFirst.mockResolvedValue(null);
      mockClubMembershipFindFirst.mockResolvedValue({
        id: "club-membership-1",
        userId: "club-admin-1",
        role: "CLUB_ADMIN",
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isAdmin).toBe(true);
      expect(data.adminType).toBe("club");
    });

    it("should return isAdmin: false for regular user", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "regular-user-1", isRoot: false },
      });
      mockMembershipFindFirst.mockResolvedValue(null);
      mockClubMembershipFindFirst.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isAdmin).toBe(false);
      expect(data.adminType).toBeNull();
    });
  });
});
