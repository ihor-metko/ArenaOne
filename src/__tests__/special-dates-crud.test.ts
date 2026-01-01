/**
 * @jest-environment node
 */

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    club: {
      findUnique: jest.fn(),
    },
    clubSpecialHours: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    membership: {
      findMany: jest.fn(),
    },
    clubMembership: {
      findMany: jest.fn(),
    },
  },
}));

// Mock auth function
const mockAuth = jest.fn();
jest.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

import { POST, GET as GetList } from "@/app/api/admin/clubs/[id]/special-dates/route";
import { PATCH, DELETE } from "@/app/api/admin/clubs/[id]/special-dates/[dateId]/route";
import { prisma } from "@/lib/prisma";

describe("Special Dates CRUD APIs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockClub = {
    id: "club-123",
    name: "Test Club",
  };

  const mockSpecialDate = {
    id: "special-123",
    clubId: "club-123",
    date: new Date("2024-12-25"),
    openTime: null,
    closeTime: null,
    isClosed: true,
    reason: "Christmas",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("POST /api/admin/clubs/[id]/special-dates - Create", () => {
    it("should return 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const request = new Request(
        "http://localhost:3000/api/admin/clubs/club-123/special-dates",
        {
          method: "POST",
          body: JSON.stringify({ date: "2024-12-25", isClosed: true }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request, { params: Promise.resolve({ id: "club-123" }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 404 when club not found", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      (prisma.club.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new Request(
        "http://localhost:3000/api/admin/clubs/club-123/special-dates",
        {
          method: "POST",
          body: JSON.stringify({ date: "2024-12-25", isClosed: true }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request, { params: Promise.resolve({ id: "club-123" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Club not found");
    });

    it("should return 400 when date is missing", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      (prisma.club.findUnique as jest.Mock).mockResolvedValue(mockClub);

      const request = new Request(
        "http://localhost:3000/api/admin/clubs/club-123/special-dates",
        {
          method: "POST",
          body: JSON.stringify({ isClosed: true }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request, { params: Promise.resolve({ id: "club-123" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Date is required");
    });

    it("should return 409 when date already exists", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      (prisma.club.findUnique as jest.Mock).mockResolvedValue(mockClub);
      (prisma.clubSpecialHours.findFirst as jest.Mock).mockResolvedValue(mockSpecialDate);

      const request = new Request(
        "http://localhost:3000/api/admin/clubs/club-123/special-dates",
        {
          method: "POST",
          body: JSON.stringify({ date: "2024-12-25", isClosed: true }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request, { params: Promise.resolve({ id: "club-123" }) });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe("A special date for this day already exists");
    });

    it("should return 400 when open but missing times", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      (prisma.club.findUnique as jest.Mock).mockResolvedValue(mockClub);

      const request = new Request(
        "http://localhost:3000/api/admin/clubs/club-123/special-dates",
        {
          method: "POST",
          body: JSON.stringify({
            date: "2024-12-25",
            isClosed: false,
            // Missing openTime and closeTime
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request, { params: Promise.resolve({ id: "club-123" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Opening and closing times are required when the club is open");
    });

    it("should create special date successfully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      (prisma.club.findUnique as jest.Mock).mockResolvedValue(mockClub);
      (prisma.clubSpecialHours.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.clubSpecialHours.create as jest.Mock).mockResolvedValue(mockSpecialDate);

      const request = new Request(
        "http://localhost:3000/api/admin/clubs/club-123/special-dates",
        {
          method: "POST",
          body: JSON.stringify({
            date: "2024-12-25",
            isClosed: true,
            reason: "Christmas",
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request, { params: Promise.resolve({ id: "club-123" }) });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe("special-123");
      expect(prisma.clubSpecialHours.create).toHaveBeenCalledWith({
        data: {
          clubId: "club-123",
          date: new Date("2024-12-25"),
          openTime: null,
          closeTime: null,
          isClosed: true,
          reason: "Christmas",
        },
      });
    });
  });

  describe("PATCH /api/admin/clubs/[id]/special-dates/[dateId] - Update", () => {
    it("should return 404 when special date not found", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      (prisma.clubSpecialHours.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new Request(
        "http://localhost:3000/api/admin/clubs/club-123/special-dates/special-123",
        {
          method: "PATCH",
          body: JSON.stringify({ reason: "Updated reason" }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: "club-123", dateId: "special-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Special date not found");
    });

    it("should update special date successfully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      (prisma.clubSpecialHours.findUnique as jest.Mock).mockResolvedValue(mockSpecialDate);
      (prisma.clubSpecialHours.update as jest.Mock).mockResolvedValue({
        ...mockSpecialDate,
        reason: "Updated reason",
      });

      const request = new Request(
        "http://localhost:3000/api/admin/clubs/club-123/special-dates/special-123",
        {
          method: "PATCH",
          body: JSON.stringify({ reason: "Updated reason" }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: "club-123", dateId: "special-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reason).toBe("Updated reason");
      expect(prisma.clubSpecialHours.update).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/admin/clubs/[id]/special-dates/[dateId] - Delete", () => {
    it("should return 404 when special date not found", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      (prisma.clubSpecialHours.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new Request(
        "http://localhost:3000/api/admin/clubs/club-123/special-dates/special-123",
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: "club-123", dateId: "special-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Special date not found");
    });

    it("should delete special date successfully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      (prisma.clubSpecialHours.findUnique as jest.Mock).mockResolvedValue(mockSpecialDate);
      (prisma.clubSpecialHours.delete as jest.Mock).mockResolvedValue(mockSpecialDate);

      const request = new Request(
        "http://localhost:3000/api/admin/clubs/club-123/special-dates/special-123",
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: "club-123", dateId: "special-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(prisma.clubSpecialHours.delete).toHaveBeenCalledWith({
        where: { id: "special-123" },
      });
    });
  });

  describe("GET /api/admin/clubs/[id]/special-dates - List", () => {
    it("should list all special dates for a club", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-123", isRoot: true },
      });

      const mockSpecialDates = [
        mockSpecialDate,
        {
          id: "special-456",
          clubId: "club-123",
          date: new Date("2024-01-01"),
          openTime: "10:00",
          closeTime: "18:00",
          isClosed: false,
          reason: "New Year",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.clubSpecialHours.findMany as jest.Mock).mockResolvedValue(mockSpecialDates);

      const request = new Request(
        "http://localhost:3000/api/admin/clubs/club-123/special-dates",
        {
          method: "GET",
        }
      );

      const response = await GetList(request, { params: Promise.resolve({ id: "club-123" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.specialDates).toHaveLength(2);
      expect(prisma.clubSpecialHours.findMany).toHaveBeenCalledWith({
        where: { clubId: "club-123" },
        orderBy: { date: 'asc' },
      });
    });
  });
});
