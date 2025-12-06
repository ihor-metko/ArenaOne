/**
 * @jest-environment node
 */
import { GET } from "@/app/api/admin/bookings/route";
import { prisma } from "@/lib/prisma";

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    booking: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

// Default mock for requireAnyAdmin - will be overridden in tests
const mockRequireAnyAdmin = jest.fn();
jest.mock("@/lib/requireRole", () => ({
  requireAnyAdmin: (...args: unknown[]) => mockRequireAnyAdmin(...args),
}));

describe("GET /api/admin/bookings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (queryParams: Record<string, string> = {}) => {
    const url = new URL("http://localhost:3000/api/admin/bookings");
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return new Request(url.toString(), { method: "GET" });
  };

  describe("Authorization", () => {
    it("should return 401 for unauthenticated users", async () => {
      mockRequireAnyAdmin.mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      });

      const request = createRequest();
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it("should return 403 for non-admin users", async () => {
      mockRequireAnyAdmin.mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }),
      });

      const request = createRequest();
      const response = await GET(request);

      expect(response.status).toBe(403);
    });
  });

  describe("Root admin", () => {
    beforeEach(() => {
      mockRequireAnyAdmin.mockResolvedValue({
        authorized: true,
        userId: "root-user-id",
        isRoot: true,
        adminType: "root_admin",
        managedIds: [],
      });
    });

    it("should return all bookings for root admin", async () => {
      const mockBookings = [
        {
          id: "booking-1",
          userId: "user-1",
          courtId: "court-1",
          coachId: null,
          start: new Date("2024-01-15T10:00:00.000Z"),
          end: new Date("2024-01-15T11:00:00.000Z"),
          status: "reserved",
          price: 5000,
          createdAt: new Date("2024-01-14T10:00:00.000Z"),
          user: {
            id: "user-1",
            name: "John Doe",
            email: "john@example.com",
          },
          court: {
            id: "court-1",
            name: "Court 1",
            clubId: "club-1",
            club: {
              id: "club-1",
              name: "Club 1",
              organizationId: "org-1",
              organization: {
                id: "org-1",
                name: "Org 1",
              },
            },
          },
          coach: null,
        },
      ];

      (prisma.booking.count as jest.Mock).mockResolvedValue(1);
      (prisma.booking.findMany as jest.Mock).mockResolvedValue(mockBookings);

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bookings).toHaveLength(1);
      expect(data.bookings[0].id).toBe("booking-1");
      expect(data.bookings[0].userName).toBe("John Doe");
      expect(data.bookings[0].clubName).toBe("Club 1");
      expect(data.bookings[0].organizationName).toBe("Org 1");
      expect(data.total).toBe(1);
      expect(data.page).toBe(1);
      expect(data.perPage).toBe(20);
    });

    it("should apply organization filter for root admin", async () => {
      (prisma.booking.count as jest.Mock).mockResolvedValue(0);
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);

      const request = createRequest({ orgId: "org-1" });
      await GET(request);

      expect(prisma.booking.findMany).toHaveBeenCalled();
      const findManyCall = (prisma.booking.findMany as jest.Mock).mock.calls[0][0];
      expect(findManyCall.where.court.club.organizationId).toBe("org-1");
    });
  });

  describe("Organization admin", () => {
    beforeEach(() => {
      mockRequireAnyAdmin.mockResolvedValue({
        authorized: true,
        userId: "org-admin-id",
        isRoot: false,
        adminType: "organization_admin",
        managedIds: ["org-1"],
      });
    });

    it("should only return bookings for managed organizations", async () => {
      (prisma.booking.count as jest.Mock).mockResolvedValue(0);
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);

      const request = createRequest();
      await GET(request);

      expect(prisma.booking.findMany).toHaveBeenCalled();
      const findManyCall = (prisma.booking.findMany as jest.Mock).mock.calls[0][0];
      expect(findManyCall.where.court.club.organizationId).toEqual({ in: ["org-1"] });
    });
  });

  describe("Club admin", () => {
    beforeEach(() => {
      mockRequireAnyAdmin.mockResolvedValue({
        authorized: true,
        userId: "club-admin-id",
        isRoot: false,
        adminType: "club_admin",
        managedIds: ["club-1"],
      });
    });

    it("should only return bookings for managed clubs", async () => {
      (prisma.booking.count as jest.Mock).mockResolvedValue(0);
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);

      const request = createRequest();
      await GET(request);

      expect(prisma.booking.findMany).toHaveBeenCalled();
      const findManyCall = (prisma.booking.findMany as jest.Mock).mock.calls[0][0];
      expect(findManyCall.where.court.clubId).toEqual({ in: ["club-1"] });
    });

    it("should return 403 when club admin tries to access another club", async () => {
      const request = createRequest({ clubId: "other-club" });
      const response = await GET(request);

      expect(response.status).toBe(403);
    });
  });

  describe("Filters", () => {
    beforeEach(() => {
      mockRequireAnyAdmin.mockResolvedValue({
        authorized: true,
        userId: "root-user-id",
        isRoot: true,
        adminType: "root_admin",
        managedIds: [],
      });
      (prisma.booking.count as jest.Mock).mockResolvedValue(0);
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);
    });

    it("should apply date range filter", async () => {
      const request = createRequest({
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      });
      await GET(request);

      const findManyCall = (prisma.booking.findMany as jest.Mock).mock.calls[0][0];
      expect(findManyCall.where.start.gte).toEqual(new Date("2024-01-01"));
      expect(findManyCall.where.start.lte).toBeDefined();
    });

    it("should apply status filter", async () => {
      const request = createRequest({ status: "cancelled" });
      await GET(request);

      const findManyCall = (prisma.booking.findMany as jest.Mock).mock.calls[0][0];
      expect(findManyCall.where.status).toBe("cancelled");
    });

    it("should apply user filter", async () => {
      const request = createRequest({ userId: "user-123" });
      await GET(request);

      const findManyCall = (prisma.booking.findMany as jest.Mock).mock.calls[0][0];
      expect(findManyCall.where.userId).toBe("user-123");
    });
  });

  describe("Pagination", () => {
    beforeEach(() => {
      mockRequireAnyAdmin.mockResolvedValue({
        authorized: true,
        userId: "root-user-id",
        isRoot: true,
        adminType: "root_admin",
        managedIds: [],
      });
    });

    it("should handle pagination parameters", async () => {
      (prisma.booking.count as jest.Mock).mockResolvedValue(100);
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);

      const request = createRequest({ page: "2", perPage: "10" });
      const response = await GET(request);
      const data = await response.json();

      expect(data.page).toBe(2);
      expect(data.perPage).toBe(10);
      expect(data.totalPages).toBe(10);

      const findManyCall = (prisma.booking.findMany as jest.Mock).mock.calls[0][0];
      expect(findManyCall.skip).toBe(10);
      expect(findManyCall.take).toBe(10);
    });

    it("should limit perPage to 100", async () => {
      (prisma.booking.count as jest.Mock).mockResolvedValue(0);
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);

      const request = createRequest({ perPage: "200" });
      await GET(request);

      const findManyCall = (prisma.booking.findMany as jest.Mock).mock.calls[0][0];
      expect(findManyCall.take).toBe(100);
    });
  });
});
