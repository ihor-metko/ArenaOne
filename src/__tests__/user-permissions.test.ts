/**
 * @jest-environment node
 */

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    membership: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    clubMembership: {
      findMany: jest.fn(),
    },
    booking: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
    club: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock auth function
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  canViewUser,
  canBlockUser,
  getAllowedActions,
} from "@/lib/userPermissions";

// Get typed mock references
const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockMembershipFindFirst = prisma.membership.findFirst as jest.MockedFunction<
  typeof prisma.membership.findFirst
>;
const mockMembershipFindMany = prisma.membership.findMany as jest.MockedFunction<
  typeof prisma.membership.findMany
>;
const mockClubMembershipFindMany = prisma.clubMembership.findMany as jest.MockedFunction<
  typeof prisma.clubMembership.findMany
>;
const mockBookingFindFirst = prisma.booking.findFirst as jest.MockedFunction<
  typeof prisma.booking.findFirst
>;

describe("User Permissions Helper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("canViewUser", () => {
    it("should return allowed=false when no session exists", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await canViewUser("target-user-123");

      expect(result.allowed).toBe(false);
    });

    it("should return allowed=true with root scope for root admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      const result = await canViewUser("target-user-123");

      expect(result.allowed).toBe(true);
      expect(result.scope).toBe("root");
      expect(result.callerId).toBe("admin-123");
      expect(result.isRoot).toBe(true);
    });

    it("should return allowed=true with organization scope when target has membership in caller's org", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "org-admin-123", isRoot: false },
      });
      mockMembershipFindMany.mockResolvedValue([
        { organizationId: "org-1" },
      ] as never[]);
      mockMembershipFindFirst.mockResolvedValue({
        organizationId: "org-1",
      } as never);

      const result = await canViewUser("target-user-123");

      expect(result.allowed).toBe(true);
      expect(result.scope).toBe("organization");
      expect(result.organizationId).toBe("org-1");
    });

    it("should return allowed=true with organization scope when target has bookings in caller's org", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "org-admin-123", isRoot: false },
      });
      mockMembershipFindMany.mockResolvedValue([
        { organizationId: "org-1" },
      ] as never[]);
      mockMembershipFindFirst.mockResolvedValue(null);
      mockBookingFindFirst.mockResolvedValueOnce({
        court: { club: { organizationId: "org-1" } },
      } as never);

      const result = await canViewUser("target-user-123");

      expect(result.allowed).toBe(true);
      expect(result.scope).toBe("organization");
      expect(result.organizationId).toBe("org-1");
    });

    it("should return allowed=true with club scope when target has bookings in caller's club", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "club-admin-123", isRoot: false },
      });
      mockMembershipFindMany.mockResolvedValue([]);
      mockClubMembershipFindMany.mockResolvedValue([
        { clubId: "club-1" },
      ] as never[]);
      mockBookingFindFirst.mockResolvedValueOnce({
        court: { clubId: "club-1" },
      } as never);

      const result = await canViewUser("target-user-123");

      expect(result.allowed).toBe(true);
      expect(result.scope).toBe("club");
      expect(result.clubId).toBe("club-1");
    });

    it("should return allowed=false for org admin when target has no relationship", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "org-admin-123", isRoot: false },
      });
      mockMembershipFindMany.mockResolvedValue([
        { organizationId: "org-1" },
      ] as never[]);
      mockMembershipFindFirst.mockResolvedValue(null);
      mockBookingFindFirst.mockResolvedValue(null);
      mockClubMembershipFindMany.mockResolvedValue([]);

      const result = await canViewUser("target-user-123");

      expect(result.allowed).toBe(false);
    });

    it("should return allowed=false for club admin when target has no bookings in club", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "club-admin-123", isRoot: false },
      });
      mockMembershipFindMany.mockResolvedValue([]);
      mockClubMembershipFindMany.mockResolvedValue([
        { clubId: "club-1" },
      ] as never[]);
      mockBookingFindFirst.mockResolvedValue(null);

      const result = await canViewUser("target-user-123");

      expect(result.allowed).toBe(false);
    });
  });

  describe("canBlockUser", () => {
    it("should return allowed=false when no session exists", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await canBlockUser("target-user-123");

      expect(result.allowed).toBe(false);
    });

    it("should return allowed=true with global scope for root admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      const result = await canBlockUser("target-user-123");

      expect(result.allowed).toBe(true);
      expect(result.scope).toBe("global");
      expect(result.callerId).toBe("admin-123");
    });

    it("should return allowed=true with organization scope for org admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "org-admin-123", isRoot: false },
      });
      mockMembershipFindMany.mockResolvedValue([
        { organizationId: "org-1" },
      ] as never[]);
      mockMembershipFindFirst.mockResolvedValue({
        organizationId: "org-1",
      } as never);

      const result = await canBlockUser("target-user-123");

      expect(result.allowed).toBe(true);
      expect(result.scope).toBe("organization");
      expect(result.organizationId).toBe("org-1");
    });

    it("should return allowed=false for club admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "club-admin-123", isRoot: false },
      });
      mockMembershipFindMany.mockResolvedValue([]);

      const result = await canBlockUser("target-user-123");

      expect(result.allowed).toBe(false);
    });
  });

  describe("getAllowedActions", () => {
    it("should return all actions for root admin", () => {
      const actions = getAllowedActions("root", true);

      expect(actions.canBlock).toBe(true);
      expect(actions.canUnblock).toBe(true);
      expect(actions.canDelete).toBe(true);
      expect(actions.canEditRole).toBe(true);
      expect(actions.canImpersonate).toBe(true);
    });

    it("should return limited actions for organization scope", () => {
      const actions = getAllowedActions("organization", false);

      expect(actions.canBlock).toBe(true);
      expect(actions.canUnblock).toBe(true);
      expect(actions.canDelete).toBe(false);
      expect(actions.canEditRole).toBe(false);
      expect(actions.canImpersonate).toBe(false);
    });

    it("should return no actions for club scope", () => {
      const actions = getAllowedActions("club", false);

      expect(actions.canBlock).toBe(false);
      expect(actions.canUnblock).toBe(false);
      expect(actions.canDelete).toBe(false);
      expect(actions.canEditRole).toBe(false);
      expect(actions.canImpersonate).toBe(false);
    });
  });
});
