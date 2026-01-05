/**
 * @jest-environment node
 */
import { GET } from "@/app/api/(player)/clubs/[id]/available-courts/route";
import { prisma } from "@/lib/prisma";
import { getResolvedPriceForSlot } from "@/lib/priceRules";

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    club: {
      findUnique: jest.fn(),
    },
    booking: {
      findMany: jest.fn(),
    },
  },
}));

// Mock priceRules
jest.mock("@/lib/priceRules", () => ({
  getResolvedPriceForSlot: jest.fn(),
}));

describe("GET /api/clubs/[id]/available-courts - Court Type Filtering", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (clubId: string, params: { date: string; start: string; duration: string; courtType?: string }) => {
    const searchParams = new URLSearchParams(params as Record<string, string>);
    const url = `http://localhost:3000/api/clubs/${clubId}/available-courts?${searchParams}`;
    return new Request(url, { method: "GET" });
  };

  it("should filter courts by type='Single'", async () => {
    // Mock should return only Single courts when filter is applied
    const mockClub = {
      id: "club-123",
      courts: [
        {
          id: "court-1",
          name: "Single Court 1",
          slug: "single-court-1",
          type: "Single",
          surface: "Clay",
          indoor: true,
          sportType: "PADEL",
          defaultPriceCents: 3000,
        },
        {
          id: "court-3",
          name: "Single Court 2",
          slug: "single-court-2",
          type: "Single",
          surface: "Clay",
          indoor: true,
          sportType: "PADEL",
          defaultPriceCents: 3200,
        },
      ],
    };

    (prisma.club.findUnique as jest.Mock).mockResolvedValue(mockClub);
    (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);
    
    // Mock resolved prices for single courts only
    (getResolvedPriceForSlot as jest.Mock)
      .mockResolvedValueOnce(3000)
      .mockResolvedValueOnce(3200);

    const request = createRequest("club-123", {
      date: "2024-01-15",
      start: "10:00",
      duration: "60",
      courtType: "Single",
    });

    const response = await GET(request, {
      params: Promise.resolve({ id: "club-123" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    
    // Should only return Single courts
    expect(data.availableCourts).toHaveLength(2);
    expect(data.availableCourts[0]).toMatchObject({
      id: "court-1",
      name: "Single Court 1",
      type: "Single",
    });
    expect(data.availableCourts[1]).toMatchObject({
      id: "court-3",
      name: "Single Court 2",
      type: "Single",
    });
  });

  it("should filter courts by type='Double'", async () => {
    // Mock should return only Double courts when filter is applied
    const mockClub = {
      id: "club-123",
      courts: [
        {
          id: "court-2",
          name: "Double Court 1",
          slug: "double-court-1",
          type: "Double",
          surface: "Hard",
          indoor: false,
          sportType: "PADEL",
          defaultPriceCents: 4000,
        },
        {
          id: "court-3",
          name: "Double Court 2",
          slug: "double-court-2",
          type: "Double",
          surface: "Artificial",
          indoor: true,
          sportType: "PADEL",
          defaultPriceCents: 4200,
        },
      ],
    };

    (prisma.club.findUnique as jest.Mock).mockResolvedValue(mockClub);
    (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);
    
    // Mock resolved prices for double courts only
    (getResolvedPriceForSlot as jest.Mock)
      .mockResolvedValueOnce(4000)
      .mockResolvedValueOnce(4200);

    const request = createRequest("club-123", {
      date: "2024-01-15",
      start: "10:00",
      duration: "60",
      courtType: "Double",
    });

    const response = await GET(request, {
      params: Promise.resolve({ id: "club-123" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    
    // Should only return Double courts
    expect(data.availableCourts).toHaveLength(2);
    expect(data.availableCourts[0]).toMatchObject({
      id: "court-2",
      name: "Double Court 1",
      type: "Double",
    });
    expect(data.availableCourts[1]).toMatchObject({
      id: "court-3",
      name: "Double Court 2",
      type: "Double",
    });
  });

  it("should return all courts when no courtType filter is provided", async () => {
    const mockClub = {
      id: "club-123",
      courts: [
        {
          id: "court-1",
          name: "Single Court",
          slug: "single-court",
          type: "Single",
          surface: "Clay",
          indoor: true,
          sportType: "PADEL",
          defaultPriceCents: 3000,
        },
        {
          id: "court-2",
          name: "Double Court",
          slug: "double-court",
          type: "Double",
          surface: "Hard",
          indoor: false,
          sportType: "PADEL",
          defaultPriceCents: 4000,
        },
      ],
    };

    (prisma.club.findUnique as jest.Mock).mockResolvedValue(mockClub);
    (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);
    
    // Mock resolved prices for all courts
    (getResolvedPriceForSlot as jest.Mock)
      .mockResolvedValueOnce(3000)
      .mockResolvedValueOnce(4000);

    const request = createRequest("club-123", {
      date: "2024-01-15",
      start: "10:00",
      duration: "60",
    });

    const response = await GET(request, {
      params: Promise.resolve({ id: "club-123" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    
    // Should return all courts
    expect(data.availableCourts).toHaveLength(2);
    expect(data.availableCourts[0].type).toBe("Single");
    expect(data.availableCourts[1].type).toBe("Double");
  });

  it("should return 400 for invalid courtType values", async () => {
    const request = createRequest("club-123", {
      date: "2024-01-15",
      start: "10:00",
      duration: "60",
      courtType: "Invalid",
    });

    const response = await GET(request, {
      params: Promise.resolve({ id: "club-123" }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Invalid court type");
  });
});
