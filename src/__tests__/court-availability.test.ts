/**
 * @jest-environment node
 */
import { GET } from "@/app/api/courts/[courtId]/availability/route";
import { prisma } from "@/lib/prisma";

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    court: {
      findUnique: jest.fn(),
    },
    booking: {
      findMany: jest.fn(),
    },
    club: {
      findUnique: jest.fn(),
    },
    clubSpecialHours: {
      findUnique: jest.fn(),
    },
  },
}));

describe("GET /api/courts/[courtId]/availability", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for club (returns default hours)
    (prisma.club.findUnique as jest.Mock).mockResolvedValue({
      mondayOpen: 9,
      mondayClose: 22,
      tuesdayOpen: 9,
      tuesdayClose: 22,
      wednesdayOpen: 9,
      wednesdayClose: 22,
      thursdayOpen: 9,
      thursdayClose: 22,
      fridayOpen: 9,
      fridayClose: 22,
      saturdayOpen: 9,
      saturdayClose: 22,
      sundayOpen: 9,
      sundayClose: 22,
    });
    
    // Default mock for special hours (no special hours)
    (prisma.clubSpecialHours.findUnique as jest.Mock).mockResolvedValue(null);
  });

  // Helper to set up court mock (called twice - once in route, once in resolveBusinessHours)
  const setupCourtMock = (court: { id: string; name?: string; clubId: string; courtOpenTime?: number | null; courtCloseTime?: number | null }) => {
    (prisma.court.findUnique as jest.Mock).mockResolvedValue({
      id: court.id,
      name: court.name || "Test Court",
      clubId: court.clubId,
      courtOpenTime: court.courtOpenTime ?? null,
      courtCloseTime: court.courtCloseTime ?? null,
    });
  };

  const createRequest = (courtId: string, date?: string) => {
    const url = date
      ? `http://localhost:3000/api/courts/${courtId}/availability?date=${date}`
      : `http://localhost:3000/api/courts/${courtId}/availability`;
    return new Request(url, { method: "GET" });
  };

  it("should return availability slots for a valid court and date", async () => {
    setupCourtMock({ id: "court-123", clubId: "club-123" });
    const mockBookings: never[] = [];

    (prisma.booking.findMany as jest.Mock).mockResolvedValue(mockBookings);

    const request = createRequest("court-123", "2024-01-15");
    const response = await GET(request, {
      params: Promise.resolve({ courtId: "court-123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.date).toBe("2024-01-15");
    expect(Array.isArray(data.slots)).toBe(true);
    expect(data.slots.length).toBeGreaterThan(0);
    // All slots should be available since there are no bookings
    data.slots.forEach((slot: { status: string }) => {
      expect(slot.status).toBe("available");
    });
    // Should include business hours in response
    expect(data.businessHours).toBeDefined();
    expect(data.businessHours.openTime).toBe(9);
    expect(data.businessHours.closeTime).toBe(22);
  });

  it("should return 404 when court not found", async () => {
    (prisma.court.findUnique as jest.Mock).mockResolvedValue(null);

    const request = createRequest("nonexistent-court", "2024-01-15");
    const response = await GET(request, {
      params: Promise.resolve({ courtId: "nonexistent-court" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Court not found");
  });

  it("should return 400 for invalid date format", async () => {
    setupCourtMock({ id: "court-123", clubId: "club-123" });

    const request = createRequest("court-123", "invalid-date");
    const response = await GET(request, {
      params: Promise.resolve({ courtId: "court-123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid date format. Use YYYY-MM-DD");
  });

  it("should mark slots as booked when there are overlapping bookings", async () => {
    setupCourtMock({ id: "court-123", clubId: "club-123" });
    const mockBookings = [
      {
        start: new Date("2024-01-15T10:00:00.000Z"),
        end: new Date("2024-01-15T11:00:00.000Z"),
      },
    ];

    (prisma.booking.findMany as jest.Mock).mockResolvedValue(mockBookings);

    const request = createRequest("court-123", "2024-01-15");
    const response = await GET(request, {
      params: Promise.resolve({ courtId: "court-123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);

    // Find the 10:00 slot and verify it's booked
    const slot10am = data.slots.find((slot: { start: string }) =>
      slot.start.includes("T10:00:00")
    );
    expect(slot10am?.status).toBe("booked");

    // The 09:00 slot should still be available
    const slot9am = data.slots.find((slot: { start: string }) =>
      slot.start.includes("T09:00:00")
    );
    expect(slot9am?.status).toBe("available");
  });

  it("should mark slots as partial when there is partial overlap", async () => {
    setupCourtMock({ id: "court-123", clubId: "club-123" });
    // Booking that starts at 10:30 and ends at 11:30 (partial overlap with 10:00-11:00 and 11:00-12:00)
    const mockBookings = [
      {
        start: new Date("2024-01-15T10:30:00.000Z"),
        end: new Date("2024-01-15T11:30:00.000Z"),
      },
    ];

    (prisma.booking.findMany as jest.Mock).mockResolvedValue(mockBookings);

    const request = createRequest("court-123", "2024-01-15");
    const response = await GET(request, {
      params: Promise.resolve({ courtId: "court-123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);

    // The 10:00 slot should be partial (booking starts mid-slot)
    const slot10am = data.slots.find((slot: { start: string }) =>
      slot.start.includes("T10:00:00")
    );
    expect(slot10am?.status).toBe("partial");

    // The 11:00 slot should be partial (booking ends mid-slot)
    const slot11am = data.slots.find((slot: { start: string }) =>
      slot.start.includes("T11:00:00")
    );
    expect(slot11am?.status).toBe("partial");
  });

  it("should use today's date when no date parameter is provided", async () => {
    setupCourtMock({ id: "court-123", clubId: "club-123" });
    (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);

    const request = createRequest("court-123");
    const response = await GET(request, {
      params: Promise.resolve({ courtId: "court-123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    // Date should be today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];
    expect(data.date).toBe(today);
  });

  it("should return 500 for database errors", async () => {
    (prisma.court.findUnique as jest.Mock).mockRejectedValue(
      new Error("Database connection failed")
    );

    const request = createRequest("court-123", "2024-01-15");
    const response = await GET(request, {
      params: Promise.resolve({ courtId: "court-123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });

  it("should use special hours override when available", async () => {
    setupCourtMock({ id: "court-123", clubId: "club-123" });
    (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);
    
    // Override with special hours for the specific date (10am - 4pm)
    (prisma.clubSpecialHours.findUnique as jest.Mock).mockResolvedValue({
      id: "special-1",
      clubId: "club-123",
      date: new Date("2024-01-15T00:00:00.000Z"),
      openTime: 10,
      closeTime: 16,
    });

    const request = createRequest("court-123", "2024-01-15");
    const response = await GET(request, {
      params: Promise.resolve({ courtId: "court-123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.businessHours.openTime).toBe(10);
    expect(data.businessHours.closeTime).toBe(16);
    // Should only have 6 slots (10, 11, 12, 13, 14, 15)
    expect(data.slots.length).toBe(6);
  });

  it("should use court-level hours when defined", async () => {
    setupCourtMock({ 
      id: "court-123", 
      clubId: "club-123",
      courtOpenTime: 11,
      courtCloseTime: 20,
    });
    (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);

    const request = createRequest("court-123", "2024-01-15");
    const response = await GET(request, {
      params: Promise.resolve({ courtId: "court-123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    // Court hours (11-20) intersected with club hours (9-22) = 11-20
    expect(data.businessHours.openTime).toBe(11);
    expect(data.businessHours.closeTime).toBe(20);
    // Should have 9 slots (11, 12, 13, 14, 15, 16, 17, 18, 19)
    expect(data.slots.length).toBe(9);
  });
});
