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

import { requireAnyAdmin, getAdminType, requireRootAdmin } from "@/lib/requireRole";
import { prisma } from "@/lib/prisma";

const mockMembershipFindFirst = prisma.membership.findFirst as jest.Mock;
const mockClubMembershipFindFirst = prisma.clubMembership.findFirst as jest.Mock;

describe("Admin Access Control", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAdminType", () => {
    it("should return 'root' when isRoot is true", async () => {
      const result = await getAdminType("user-123", true);
      expect(result).toBe("root");
      // Should not query database when isRoot is true
      expect(mockMembershipFindFirst).not.toHaveBeenCalled();
      expect(mockClubMembershipFindFirst).not.toHaveBeenCalled();
    });

    it("should return 'organization' when user has ORGANIZATION_ADMIN membership", async () => {
      mockMembershipFindFirst.mockResolvedValue({
        id: "membership-1",
        userId: "user-123",
        role: "ORGANIZATION_ADMIN",
      });

      const result = await getAdminType("user-123", false);
      expect(result).toBe("organization");
      expect(mockMembershipFindFirst).toHaveBeenCalledWith({
        where: {
          userId: "user-123",
          role: "ORGANIZATION_ADMIN",
        },
      });
    });

    it("should return 'club' when user has CLUB_ADMIN club membership", async () => {
      mockMembershipFindFirst.mockResolvedValue(null);
      mockClubMembershipFindFirst.mockResolvedValue({
        id: "club-membership-1",
        userId: "user-123",
        role: "CLUB_ADMIN",
      });

      const result = await getAdminType("user-123", false);
      expect(result).toBe("club");
      expect(mockClubMembershipFindFirst).toHaveBeenCalledWith({
        where: {
          userId: "user-123",
          role: "CLUB_ADMIN",
        },
      });
    });

    it("should return null when user has no admin role", async () => {
      mockMembershipFindFirst.mockResolvedValue(null);
      mockClubMembershipFindFirst.mockResolvedValue(null);

      const result = await getAdminType("user-123", false);
      expect(result).toBeNull();
    });

    it("should prioritize organization admin over club admin", async () => {
      mockMembershipFindFirst.mockResolvedValue({
        id: "membership-1",
        userId: "user-123",
        role: "ORGANIZATION_ADMIN",
      });

      const result = await getAdminType("user-123", false);
      expect(result).toBe("organization");
      // Should not check club membership when org admin is found
      expect(mockClubMembershipFindFirst).not.toHaveBeenCalled();
    });
  });

  describe("requireAnyAdmin", () => {
    it("should return 401 Unauthorized when no session exists", async () => {
      mockAuth.mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/admin/dashboard");
      const result = await requireAnyAdmin(request);

      expect(result.authorized).toBe(false);
      if (!result.authorized) {
        const data = await result.response.json();
        expect(result.response.status).toBe(401);
        expect(data.error).toBe("Unauthorized");
      }
    });

    it("should return 401 Unauthorized when session has no user", async () => {
      mockAuth.mockResolvedValue({ user: null });

      const request = new Request("http://localhost:3000/api/admin/dashboard");
      const result = await requireAnyAdmin(request);

      expect(result.authorized).toBe(false);
      if (!result.authorized) {
        const data = await result.response.json();
        expect(result.response.status).toBe(401);
        expect(data.error).toBe("Unauthorized");
      }
    });

    it("should authorize root admin users", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "root-admin-123", isRoot: true },
      });

      const request = new Request("http://localhost:3000/api/admin/dashboard");
      const result = await requireAnyAdmin(request);

      expect(result.authorized).toBe(true);
      if (result.authorized) {
        expect(result.userId).toBe("root-admin-123");
        expect(result.adminType).toBe("root");
      }
    });

    it("should authorize organization admin users", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "org-admin-123", isRoot: false },
      });
      mockMembershipFindFirst.mockResolvedValue({
        id: "membership-1",
        userId: "org-admin-123",
        role: "ORGANIZATION_ADMIN",
      });

      const request = new Request("http://localhost:3000/api/admin/dashboard");
      const result = await requireAnyAdmin(request);

      expect(result.authorized).toBe(true);
      if (result.authorized) {
        expect(result.userId).toBe("org-admin-123");
        expect(result.adminType).toBe("organization");
      }
    });

    it("should authorize club admin users", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "club-admin-123", isRoot: false },
      });
      mockMembershipFindFirst.mockResolvedValue(null);
      mockClubMembershipFindFirst.mockResolvedValue({
        id: "club-membership-1",
        userId: "club-admin-123",
        role: "CLUB_ADMIN",
      });

      const request = new Request("http://localhost:3000/api/admin/dashboard");
      const result = await requireAnyAdmin(request);

      expect(result.authorized).toBe(true);
      if (result.authorized) {
        expect(result.userId).toBe("club-admin-123");
        expect(result.adminType).toBe("club");
      }
    });

    it("should return 403 Forbidden for regular users", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "regular-user-123", isRoot: false },
      });
      mockMembershipFindFirst.mockResolvedValue(null);
      mockClubMembershipFindFirst.mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/admin/dashboard");
      const result = await requireAnyAdmin(request);

      expect(result.authorized).toBe(false);
      if (!result.authorized) {
        const data = await result.response.json();
        expect(result.response.status).toBe(403);
        expect(data.error).toBe("Forbidden");
      }
    });
  });

  describe("requireRootAdmin", () => {
    it("should return 401 Unauthorized when no session exists", async () => {
      mockAuth.mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/admin/root-only");
      const result = await requireRootAdmin(request);

      expect(result.authorized).toBe(false);
      if (!result.authorized) {
        const data = await result.response.json();
        expect(result.response.status).toBe(401);
        expect(data.error).toBe("Unauthorized");
      }
    });

    it("should return 403 Forbidden for non-root users", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-123", isRoot: false },
      });

      const request = new Request("http://localhost:3000/api/admin/root-only");
      const result = await requireRootAdmin(request);

      expect(result.authorized).toBe(false);
      if (!result.authorized) {
        const data = await result.response.json();
        expect(result.response.status).toBe(403);
        expect(data.error).toBe("Forbidden");
      }
    });

    it("should authorize root admin users", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "root-admin-123", isRoot: true },
      });

      const request = new Request("http://localhost:3000/api/admin/root-only");
      const result = await requireRootAdmin(request);

      expect(result.authorized).toBe(true);
      if (result.authorized) {
        expect(result.userId).toBe("root-admin-123");
      }
    });
  });
});
