/**
 * @jest-environment node
 */

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    booking: {
      groupBy: jest.fn(),
    },
  },
}));

// Mock requireRootAdmin
jest.mock("@/lib/requireRole", () => ({
  requireRootAdmin: jest.fn(),
}));

import { GET } from "@/app/api/admin/users/route";
import { prisma } from "@/lib/prisma";
import { requireRootAdmin } from "@/lib/requireRole";

const mockUserFindMany = prisma.user.findMany as jest.Mock;
const mockUserCount = prisma.user.count as jest.Mock;
const mockBookingGroupBy = prisma.booking.groupBy as jest.Mock;
const mockRequireRootAdmin = requireRootAdmin as jest.Mock;

describe("Unified Admin Users API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRootAdmin.mockResolvedValue({
      authorized: true,
      user: { id: "admin-123", isRoot: true },
    });
  });

  describe("GET /api/admin/users - Simple Mode", () => {
    it("should return simple user list when simple=true", async () => {
      const mockUsers = [
        {
          id: "user-1",
          name: "User One",
          email: "user1@test.com",
          memberships: [],
        },
        {
          id: "user-2",
          name: "User Two",
          email: "user2@test.com",
          memberships: [
            {
              role: "ORGANIZATION_ADMIN",
              organization: { name: "Test Org" },
            },
          ],
        },
      ];

      mockUserFindMany.mockResolvedValue(mockUsers);

      const request = new Request(
        "http://localhost:3000/api/admin/users?simple=true",
        { method: "GET" }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0]).toHaveProperty("id");
      expect(data[0]).toHaveProperty("name");
      expect(data[0]).toHaveProperty("email");
      expect(data[0]).toHaveProperty("isOrgAdmin");
      expect(data[1].isOrgAdmin).toBe(true);
    });

    it("should support search query with q parameter", async () => {
      mockUserFindMany.mockResolvedValue([]);

      const request = new Request(
        "http://localhost:3000/api/admin/users?simple=true&q=test",
        { method: "GET" }
      );

      await GET(request);

      expect(mockUserFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isRoot: false,
            OR: [
              { name: { contains: "test", mode: "insensitive" } },
              { email: { contains: "test", mode: "insensitive" } },
            ],
          }),
        })
      );
    });
  });

  describe("GET /api/admin/users - Full Mode", () => {
    it("should return paginated user list with full data", async () => {
      const mockUsers = [
        {
          id: "user-1",
          name: "User One",
          email: "user1@test.com",
          isRoot: false,
          blocked: false,
          createdAt: new Date("2024-01-01"),
          lastLoginAt: new Date("2024-01-10"),
          memberships: [],
          clubMemberships: [],
          bookings: [],
          _count: { bookings: 5 },
        },
      ];

      mockUserCount.mockResolvedValue(1);
      mockUserFindMany.mockResolvedValue(mockUsers);
      mockBookingGroupBy.mockResolvedValue([]);

      const request = new Request(
        "http://localhost:3000/api/admin/users?page=1&limit=25",
        { method: "GET" }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("users");
      expect(data).toHaveProperty("pagination");
      expect(Array.isArray(data.users)).toBe(true);
      expect(data.pagination).toEqual({
        page: 1,
        pageSize: 25,
        limit: 25,
        totalCount: 1,
        totalPages: 1,
      });
    });

    it("should support search parameter", async () => {
      mockUserCount.mockResolvedValue(0);
      mockUserFindMany.mockResolvedValue([]);
      mockBookingGroupBy.mockResolvedValue([]);

      const request = new Request(
        "http://localhost:3000/api/admin/users?search=john",
        { method: "GET" }
      );

      await GET(request);

      const whereClause = mockUserFindMany.mock.calls[0][0].where;
      expect(whereClause.AND).toContainEqual({
        OR: [
          { name: { contains: "john", mode: "insensitive" } },
          { email: { contains: "john", mode: "insensitive" } },
          { id: { contains: "john", mode: "insensitive" } },
        ],
      });
    });

    it("should support role filter", async () => {
      mockUserCount.mockResolvedValue(0);
      mockUserFindMany.mockResolvedValue([]);
      mockBookingGroupBy.mockResolvedValue([]);

      const request = new Request(
        "http://localhost:3000/api/admin/users?role=organization_admin",
        { method: "GET" }
      );

      await GET(request);

      const whereClause = mockUserFindMany.mock.calls[0][0].where;
      expect(whereClause.AND).toContainEqual({
        memberships: {
          some: { role: "ORGANIZATION_ADMIN" },
        },
      });
    });

    it("should support organizationId filter", async () => {
      mockUserCount.mockResolvedValue(0);
      mockUserFindMany.mockResolvedValue([]);
      mockBookingGroupBy.mockResolvedValue([]);

      const request = new Request(
        "http://localhost:3000/api/admin/users?organizationId=org-123",
        { method: "GET" }
      );

      await GET(request);

      const whereClause = mockUserFindMany.mock.calls[0][0].where;
      expect(whereClause.AND).toContainEqual({
        memberships: {
          some: { organizationId: "org-123" },
        },
      });
    });

    it("should support clubId filter", async () => {
      mockUserCount.mockResolvedValue(0);
      mockUserFindMany.mockResolvedValue([]);
      mockBookingGroupBy.mockResolvedValue([]);

      const request = new Request(
        "http://localhost:3000/api/admin/users?clubId=club-123",
        { method: "GET" }
      );

      await GET(request);

      const whereClause = mockUserFindMany.mock.calls[0][0].where;
      expect(whereClause.AND).toContainEqual({
        clubMemberships: {
          some: { clubId: "club-123" },
        },
      });
    });

    it("should support pageSize as alias for limit", async () => {
      mockUserCount.mockResolvedValue(0);
      mockUserFindMany.mockResolvedValue([]);
      mockBookingGroupBy.mockResolvedValue([]);

      const request = new Request(
        "http://localhost:3000/api/admin/users?pageSize=50",
        { method: "GET" }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.limit).toBe(50);
      expect(data.pagination.pageSize).toBe(50);
    });
  });

  describe("GET /api/admin/users - Authorization", () => {
    it("should return 401 when not authorized", async () => {
      mockRequireRootAdmin.mockResolvedValue({
        authorized: false,
        response: Response.json({ error: "Unauthorized" }, { status: 401 }),
      });

      const request = new Request(
        "http://localhost:3000/api/admin/users",
        { method: "GET" }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });
});
