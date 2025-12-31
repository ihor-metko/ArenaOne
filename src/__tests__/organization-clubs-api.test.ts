/**
 * @jest-environment node
 */

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    organization: {
      findUnique: jest.fn(),
    },
    club: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    booking: {
      count: jest.fn(),
    },
  },
}));

// Mock auth function
const mockAuth = jest.fn();
jest.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

import { GET } from "@/app/api/admin/organizations/[id]/clubs/route";
import { prisma } from "@/lib/prisma";

describe("GET /api/admin/organizations/[id]/clubs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const request = new Request("http://localhost:3000/api/admin/organizations/org-1/clubs");
    const response = await GET(request, { params: Promise.resolve({ id: "org-1" }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 404 when organization not found", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-123", isRoot: true },
    });

    (prisma.organization.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new Request("http://localhost:3000/api/admin/organizations/org-1/clubs");
    const response = await GET(request, { params: Promise.resolve({ id: "org-1" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Organization not found");
  });

  it("should return clubs with statistics for authorized user", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-123", isRoot: true },
    });

    const mockOrg = {
      id: "org-1",
      name: "Test Organization",
    };

    const mockClubs = [
      {
        id: "club-1",
        name: "Club 1",
        slug: "club-1",
        city: "City 1",
        isPublic: true,
        createdAt: new Date("2024-01-01"),
        _count: {
          courts: 3,
        },
      },
      {
        id: "club-2",
        name: "Club 2",
        slug: "club-2",
        city: "City 2",
        isPublic: false,
        createdAt: new Date("2024-01-02"),
        _count: {
          courts: 5,
        },
      },
    ];

    (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);
    (prisma.club.findMany as jest.Mock).mockResolvedValue(mockClubs);
    (prisma.club.count as jest.Mock).mockResolvedValue(2);
    
    // Mock booking counts
    (prisma.booking.count as jest.Mock)
      .mockResolvedValueOnce(5) // Active upcoming bookings for club-1
      .mockResolvedValueOnce(10) // Past bookings for club-1
      .mockResolvedValueOnce(3) // Active upcoming bookings for club-2
      .mockResolvedValueOnce(7); // Past bookings for club-2

    const request = new Request("http://localhost:3000/api/admin/organizations/org-1/clubs");
    const response = await GET(request, { params: Promise.resolve({ id: "org-1" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.clubs).toHaveLength(2);
    
    expect(data.clubs[0]).toEqual({
      id: "club-1",
      name: "Club 1",
      slug: "club-1",
      city: "City 1",
      isPublic: true,
      createdAt: expect.any(String),
      statistics: {
        courtCount: 3,
        activeUpcomingBookings: 5,
        pastBookings: 10,
      },
    });
    
    expect(data.clubs[1]).toEqual({
      id: "club-2",
      name: "Club 2",
      slug: "club-2",
      city: "City 2",
      isPublic: false,
      createdAt: expect.any(String),
      statistics: {
        courtCount: 5,
        activeUpcomingBookings: 3,
        pastBookings: 7,
      },
    });

    expect(data.pagination).toEqual({
      page: 1,
      limit: 10,
      totalCount: 2,
      totalPages: 1,
    });
  });

  it("should support pagination parameters", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-123", isRoot: true },
    });

    const mockOrg = {
      id: "org-1",
      name: "Test Organization",
    };

    (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);
    (prisma.club.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.club.count as jest.Mock).mockResolvedValue(25);

    const request = new Request("http://localhost:3000/api/admin/organizations/org-1/clubs?page=2&limit=5");
    const response = await GET(request, { params: Promise.resolve({ id: "org-1" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination).toEqual({
      page: 2,
      limit: 5,
      totalCount: 25,
      totalPages: 5,
    });

    // Verify pagination parameters were used correctly
    expect(prisma.club.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
      })
    );
  });
});
