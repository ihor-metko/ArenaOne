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
import { GET } from "@/app/api/admin/users/[userId]/route";
import { POST as blockUser } from "@/app/api/admin/users/[userId]/block/route";
import { POST as unblockUser } from "@/app/api/admin/users/[userId]/unblock/route";

// Get typed mock references
const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockUserFindUnique = prisma.user.findUnique as jest.MockedFunction<
  typeof prisma.user.findUnique
>;
const mockUserUpdate = prisma.user.update as jest.MockedFunction<
  typeof prisma.user.update
>;
const mockMembershipFindMany = prisma.membership.findMany as jest.MockedFunction<
  typeof prisma.membership.findMany
>;
const mockMembershipFindFirst = prisma.membership.findFirst as jest.MockedFunction<
  typeof prisma.membership.findFirst
>;
const mockClubMembershipFindMany = prisma.clubMembership.findMany as jest.MockedFunction<
  typeof prisma.clubMembership.findMany
>;
const mockBookingFindFirst = prisma.booking.findFirst as jest.MockedFunction<
  typeof prisma.booking.findFirst
>;
const mockBookingFindMany = prisma.booking.findMany as jest.MockedFunction<
  typeof prisma.booking.findMany
>;
const mockBookingCount = prisma.booking.count as jest.MockedFunction<
  typeof prisma.booking.count
>;
const mockAuditLogFindMany = prisma.auditLog.findMany as jest.MockedFunction<
  typeof prisma.auditLog.findMany
>;
const mockAuditLogCreate = prisma.auditLog.create as jest.MockedFunction<
  typeof prisma.auditLog.create
>;
const mockOrganizationFindUnique = prisma.organization.findUnique as jest.MockedFunction<
  typeof prisma.organization.findUnique
>;

describe("User Detail API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/admin/users/[userId]", () => {
    it("should return 403 when user is not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/admin/users/user-123", {
        method: "GET",
      });

      const response = await GET(request, {
        params: Promise.resolve({ userId: "user-123" }),
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Forbidden");
    });

    it("should return full projection for root admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      // First call to check if user exists
      mockUserFindUnique.mockResolvedValueOnce({ id: "user-123" } as never);

      // Second call for full user data
      mockUserFindUnique.mockResolvedValueOnce({
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        isRoot: false,
        blocked: false,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        emailVerified: new Date(),
        image: null,
        memberships: [],
        clubMemberships: [],
        bookings: [],
        coaches: [],
        _count: { bookings: 5 },
      } as never);

      mockAuditLogFindMany.mockResolvedValue([]);

      const request = new Request("http://localhost:3000/api/admin/users/user-123", {
        method: "GET",
      });

      const response = await GET(request, {
        params: Promise.resolve({ userId: "user-123" }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe("user-123");
      expect(data.viewScope).toBe("root");
      expect(data.allowedActions).toBeDefined();
      expect(data.allowedActions.canBlock).toBe(true);
      expect(data.allowedActions.canDelete).toBe(true);
    });

    it("should return 404 when user not found", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      mockUserFindUnique.mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/admin/users/nonexistent", {
        method: "GET",
      });

      const response = await GET(request, {
        params: Promise.resolve({ userId: "nonexistent" }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("User not found");
    });

    it("should return organization projection for org admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "org-admin-123", isRoot: false },
      });

      mockMembershipFindMany.mockResolvedValue([
        { organizationId: "org-1" },
      ] as never[]);
      mockMembershipFindFirst.mockResolvedValue({
        organizationId: "org-1",
      } as never);

      mockUserFindUnique.mockResolvedValueOnce({ id: "user-123" } as never);

      mockOrganizationFindUnique.mockResolvedValue({
        id: "org-1",
        name: "Test Org",
      } as never);

      mockUserFindUnique.mockResolvedValueOnce({
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        blocked: false,
        memberships: [
          { id: "m-1", role: "MEMBER", isPrimaryOwner: false, organization: { id: "org-1", name: "Test Org" } },
        ],
      } as never);

      mockBookingFindMany.mockResolvedValue([]);
      mockBookingCount.mockResolvedValue(0);

      const request = new Request("http://localhost:3000/api/admin/users/user-123", {
        method: "GET",
      });

      const response = await GET(request, {
        params: Promise.resolve({ userId: "user-123" }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe("user-123");
      expect(data.viewScope).toBe("organization");
      expect(data.viewContext).toBeDefined();
      expect(data.viewContext.type).toBe("organization");
      expect(data.allowedActions.canBlock).toBe(true);
      expect(data.allowedActions.canDelete).toBe(false);
    });

    it("should return 403 for org admin when user has no relationship", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "org-admin-123", isRoot: false },
      });

      mockMembershipFindMany.mockResolvedValue([
        { organizationId: "org-1" },
      ] as never[]);
      mockMembershipFindFirst.mockResolvedValue(null);
      mockBookingFindFirst.mockResolvedValue(null);
      mockClubMembershipFindMany.mockResolvedValue([]);

      const request = new Request("http://localhost:3000/api/admin/users/unrelated-user", {
        method: "GET",
      });

      const response = await GET(request, {
        params: Promise.resolve({ userId: "unrelated-user" }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe("POST /api/admin/users/[userId]/block", () => {
    it("should return 403 when user is not authorized to block", async () => {
      mockAuth.mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/admin/users/user-123/block", {
        method: "POST",
      });

      const response = await blockUser(request, {
        params: Promise.resolve({ userId: "user-123" }),
      });

      expect(response.status).toBe(403);
    });

    it("should block user when authorized", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      mockUserFindUnique.mockResolvedValue({
        id: "user-123",
        isRoot: false,
        blocked: false,
        email: "test@example.com",
        name: "Test User",
      } as never);

      mockUserUpdate.mockResolvedValue({
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        blocked: true,
      } as never);

      mockAuditLogCreate.mockResolvedValue({} as never);

      const request = new Request("http://localhost:3000/api/admin/users/user-123/block", {
        method: "POST",
      });

      const response = await blockUser(request, {
        params: Promise.resolve({ userId: "user-123" }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user.blocked).toBe(true);
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });

    it("should not allow blocking root admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      mockUserFindUnique.mockResolvedValue({
        id: "root-user",
        isRoot: true,
        blocked: false,
        email: "root@example.com",
        name: "Root Admin",
      } as never);

      const request = new Request("http://localhost:3000/api/admin/users/root-user/block", {
        method: "POST",
      });

      const response = await blockUser(request, {
        params: Promise.resolve({ userId: "root-user" }),
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Cannot block root admin");
    });

    it("should return 404 when user not found", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      mockUserFindUnique.mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/admin/users/nonexistent/block", {
        method: "POST",
      });

      const response = await blockUser(request, {
        params: Promise.resolve({ userId: "nonexistent" }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/admin/users/[userId]/unblock", () => {
    it("should unblock user when authorized", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      mockUserFindUnique.mockResolvedValue({
        id: "user-123",
        isRoot: false,
        blocked: true,
        email: "test@example.com",
        name: "Test User",
      } as never);

      mockUserUpdate.mockResolvedValue({
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        blocked: false,
      } as never);

      mockAuditLogCreate.mockResolvedValue({} as never);

      const request = new Request("http://localhost:3000/api/admin/users/user-123/unblock", {
        method: "POST",
      });

      const response = await unblockUser(request, {
        params: Promise.resolve({ userId: "user-123" }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user.blocked).toBe(false);
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });

    it("should return message when user is already active", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      mockUserFindUnique.mockResolvedValue({
        id: "user-123",
        isRoot: false,
        blocked: false,
        email: "test@example.com",
        name: "Test User",
      } as never);

      const request = new Request("http://localhost:3000/api/admin/users/user-123/unblock", {
        method: "POST",
      });

      const response = await unblockUser(request, {
        params: Promise.resolve({ userId: "user-123" }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe("User is already active");
    });
  });
});
