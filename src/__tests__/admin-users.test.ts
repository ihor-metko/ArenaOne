/**
 * @jest-environment node
 */

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    membership: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    clubMembership: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
    club: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Mock auth function
const mockAuth = jest.fn();
jest.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

import { GET as GetUsersList } from "@/app/api/admin/users/list/route";
import { GET as GetUserDetail, PATCH as UpdateUser, DELETE as DeleteUser } from "@/app/api/admin/users/[userId]/route";
import { PATCH as UpdateUserRole } from "@/app/api/admin/users/[userId]/role/route";
import { prisma } from "@/lib/prisma";

describe("Admin Users API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/admin/users/list", () => {
    it("should return 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/admin/users/list", {
        method: "GET",
      });

      const response = await GetUsersList(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 403 when user is not root admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-123", isRoot: false },
      });

      const request = new Request("http://localhost:3000/api/admin/users/list", {
        method: "GET",
      });

      const response = await GetUsersList(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should return paginated users for root admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      const mockUsers = [
        {
          id: "user-1",
          name: "Player One",
          email: "player@test.com",
          isRoot: false,
          blocked: false,
          createdAt: new Date(),
          lastLoginAt: new Date(),
          memberships: [],
          clubMemberships: [],
          bookings: [],
        },
      ];

      (prisma.user.count as jest.Mock).mockResolvedValue(1);
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const request = new Request("http://localhost:3000/api/admin/users/list", {
        method: "GET",
      });

      const response = await GetUsersList(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.users).toHaveLength(1);
      expect(data.pagination.totalCount).toBe(1);
    });

    it("should filter users by search query", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      (prisma.user.count as jest.Mock).mockResolvedValue(0);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request(
        "http://localhost:3000/api/admin/users/list?search=test",
        { method: "GET" }
      );

      await GetUsersList(request);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: [
                  { name: { contains: "test", mode: "insensitive" } },
                  { email: { contains: "test", mode: "insensitive" } },
                ],
              }),
            ]),
          }),
        })
      );
    });

    it("should filter users by role", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      (prisma.user.count as jest.Mock).mockResolvedValue(0);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request(
        "http://localhost:3000/api/admin/users/list?role=root_admin",
        { method: "GET" }
      );

      await GetUsersList(request);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                isRoot: true,
              }),
            ]),
          }),
        })
      );
    });

    it("should return 500 for database errors", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      (prisma.user.count as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const request = new Request("http://localhost:3000/api/admin/users/list", {
        method: "GET",
      });

      const response = await GetUsersList(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });

  describe("GET /api/admin/users/[userId]", () => {
    it("should return 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/admin/users/user-123", {
        method: "GET",
      });

      const response = await GetUserDetail(request, {
        params: Promise.resolve({ userId: "user-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return user details for root admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      const mockUser = {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        isRoot: false,
        blocked: false,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        emailVerified: null,
        image: null,
        memberships: [],
        clubMemberships: [],
        bookings: [],
        coaches: [],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const request = new Request("http://localhost:3000/api/admin/users/user-123", {
        method: "GET",
      });

      const response = await GetUserDetail(request, {
        params: Promise.resolve({ userId: "user-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.email).toBe("test@example.com");
      expect(data.role).toBe("user");
    });

    it("should return 404 when user not found", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/admin/users/nonexistent", {
        method: "GET",
      });

      const response = await GetUserDetail(request, {
        params: Promise.resolve({ userId: "nonexistent" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("User not found");
    });
  });

  describe("PATCH /api/admin/users/[userId]", () => {
    it("should block a user", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      const existingUser = {
        id: "user-123",
        isRoot: false,
      };

      const updatedUser = {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        blocked: true,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const request = new Request("http://localhost:3000/api/admin/users/user-123", {
        method: "PATCH",
        body: JSON.stringify({ blocked: true }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await UpdateUser(request, {
        params: Promise.resolve({ userId: "user-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.blocked).toBe(true);
    });

    it("should return 403 when trying to block root admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      const rootAdminUser = {
        id: "root-user",
        isRoot: true,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(rootAdminUser);

      const request = new Request("http://localhost:3000/api/admin/users/root-user", {
        method: "PATCH",
        body: JSON.stringify({ blocked: true }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await UpdateUser(request, {
        params: Promise.resolve({ userId: "root-user" }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Cannot block root admin");
    });
  });

  describe("DELETE /api/admin/users/[userId]", () => {
    it("should delete a user", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      const existingUser = {
        id: "user-123",
        isRoot: false,
        email: "test@example.com",
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
      (prisma.user.delete as jest.Mock).mockResolvedValue(existingUser);

      const request = new Request("http://localhost:3000/api/admin/users/user-123", {
        method: "DELETE",
      });

      const response = await DeleteUser(request, {
        params: Promise.resolve({ userId: "user-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should return 403 when trying to delete root admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      const rootAdminUser = {
        id: "root-user",
        isRoot: true,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(rootAdminUser);

      const request = new Request("http://localhost:3000/api/admin/users/root-user", {
        method: "DELETE",
      });

      const response = await DeleteUser(request, {
        params: Promise.resolve({ userId: "root-user" }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Cannot delete root admin");
    });
  });

  describe("PATCH /api/admin/users/[userId]/role", () => {
    it("should return 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const request = new Request(
        "http://localhost:3000/api/admin/users/user-123/role",
        {
          method: "PATCH",
          body: JSON.stringify({ role: "user" }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await UpdateUserRole(request, {
        params: Promise.resolve({ userId: "user-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 403 when user is not root admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-123", isRoot: false },
      });

      const request = new Request(
        "http://localhost:3000/api/admin/users/user-123/role",
        {
          method: "PATCH",
          body: JSON.stringify({ role: "user" }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await UpdateUserRole(request, {
        params: Promise.resolve({ userId: "user-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should update user role to organization admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      const existingUser = {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        isRoot: false,
      };

      const mockOrganization = {
        id: "org-123",
        name: "Test Org",
      };

      const updatedUser = {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        isRoot: false,
        memberships: [{ role: "ORGANIZATION_ADMIN", organization: mockOrganization }],
        clubMemberships: [],
      };

      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(updatedUser);
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrganization);
      (prisma.membership.upsert as jest.Mock).mockResolvedValue({});

      const request = new Request(
        "http://localhost:3000/api/admin/users/user-123/role",
        {
          method: "PATCH",
          body: JSON.stringify({ role: "organization_admin", organizationId: "org-123" }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await UpdateUserRole(request, {
        params: Promise.resolve({ userId: "user-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.role).toBe("organization_admin");
    });

    it("should demote user to regular user", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      const existingUser = {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        isRoot: false,
      };

      const updatedUser = {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        isRoot: false,
        memberships: [],
        clubMemberships: [],
      };

      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(updatedUser);
      (prisma.$transaction as jest.Mock).mockResolvedValue([{}, {}]);

      const request = new Request(
        "http://localhost:3000/api/admin/users/user-123/role",
        {
          method: "PATCH",
          body: JSON.stringify({ role: "user" }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await UpdateUserRole(request, {
        params: Promise.resolve({ userId: "user-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.role).toBe("user");
    });

    it("should return 404 when user not found", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new Request(
        "http://localhost:3000/api/admin/users/nonexistent/role",
        {
          method: "PATCH",
          body: JSON.stringify({ role: "user" }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await UpdateUserRole(request, {
        params: Promise.resolve({ userId: "nonexistent" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("User not found");
    });

    it("should return 403 when trying to modify root admin role", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      const rootAdminUser = {
        id: "root-user",
        name: "Root Admin",
        email: "root@test.com",
        isRoot: true,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(rootAdminUser);

      const request = new Request(
        "http://localhost:3000/api/admin/users/root-user/role",
        {
          method: "PATCH",
          body: JSON.stringify({ role: "user" }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await UpdateUserRole(request, {
        params: Promise.resolve({ userId: "root-user" }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Cannot modify root admin role");
    });

    it("should return 400 for invalid role", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      const request = new Request(
        "http://localhost:3000/api/admin/users/user-123/role",
        {
          method: "PATCH",
          body: JSON.stringify({ role: "invalid_role" }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await UpdateUserRole(request, {
        params: Promise.resolve({ userId: "user-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Invalid role");
    });

    it("should return 400 when organization_admin role without organizationId", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      const existingUser = {
        id: "user-123",
        isRoot: false,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      const request = new Request(
        "http://localhost:3000/api/admin/users/user-123/role",
        {
          method: "PATCH",
          body: JSON.stringify({ role: "organization_admin" }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await UpdateUserRole(request, {
        params: Promise.resolve({ userId: "user-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Organization ID is required");
    });

    it("should return 500 for database errors", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      (prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const request = new Request(
        "http://localhost:3000/api/admin/users/user-123/role",
        {
          method: "PATCH",
          body: JSON.stringify({ role: "user" }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await UpdateUserRole(request, {
        params: Promise.resolve({ userId: "user-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });
});
