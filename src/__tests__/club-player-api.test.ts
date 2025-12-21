/**
 * @jest-environment node
 */

/**
 * Tests for /api/clubs/[id] endpoint (player-facing)
 */

import { GET } from "@/app/api/clubs/[id]/route";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/services/mockDb";

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    club: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@/services/mockDb", () => ({
  isMockMode: jest.fn(),
  getMockClubs: jest.fn(),
  getMockCourts: jest.fn(),
  getMockCoaches: jest.fn(),
  getMockBusinessHours: jest.fn(),
  getMockGalleryImages: jest.fn(),
  getMockUsers: jest.fn(),
}));

describe("/api/clubs/[id] - Player API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isMockMode as jest.Mock).mockReturnValue(false);
  });

  it("should return public club details for a public club", async () => {
    const mockClub = {
      id: "club-1",
      name: "Test Club",
      slug: "test-club",
      shortDescription: "A test club",
      longDescription: "This is a test club",
      location: "123 Main St",
      city: "Test City",
      country: "Test Country",
      latitude: 40.7128,
      longitude: -74.0060,
      phone: "+1234567890",
      email: "test@club.com",
      website: "https://testclub.com",
      socialLinks: null,
      contactInfo: null,
      openingHours: null,
      logo: "logo.png",
      heroImage: "hero.png",
      defaultCurrency: "USD",
      timezone: "UTC",
      tags: "padel,tennis",
      isPublic: true,
      organization: {
        isPublic: true,
      },
      courts: [
        {
          id: "court-1",
          name: "Court 1",
          type: "outdoor",
          surface: "hard",
          indoor: false,
          defaultPriceCents: 5000,
        },
      ],
      coaches: [
        {
          id: "coach-1",
          user: {
            name: "Coach Name",
          },
        },
      ],
      businessHours: [
        {
          id: "bh-1",
          dayOfWeek: 1,
          openTime: "08:00",
          closeTime: "22:00",
          isClosed: false,
        },
      ],
      gallery: [
        {
          id: "img-1",
          imageUrl: "image1.png",
          altText: "Image 1",
          sortOrder: 1,
        },
      ],
    };

    (prisma.club.findUnique as jest.Mock).mockResolvedValue(mockClub);

    const request = new Request("http://localhost:3000/api/clubs/club-1");
    const params = Promise.resolve({ id: "club-1" });
    const response = await GET(request, { params });

    expect(response.status).toBe(200);
    const data = await response.json();

    // Should return public fields
    expect(data).toMatchObject({
      id: "club-1",
      name: "Test Club",
      location: "123 Main St",
      city: "Test City",
      phone: "+1234567890",
      email: "test@club.com",
    });

    // Should include courts, coaches, businessHours, and gallery
    expect(data.courts).toHaveLength(1);
    expect(data.coaches).toHaveLength(1);
    expect(data.businessHours).toHaveLength(1);
    expect(data.gallery).toHaveLength(1);

    // Should transform coaches to only include name
    expect(data.coaches[0]).toEqual({
      id: "coach-1",
      name: "Coach Name",
    });
  });

  it("should return 404 for a non-public club", async () => {
    const mockClub = {
      id: "club-1",
      name: "Test Club",
      isPublic: false,
      organization: {
        isPublic: true,
      },
    };

    (prisma.club.findUnique as jest.Mock).mockResolvedValue(mockClub);

    const request = new Request("http://localhost:3000/api/clubs/club-1");
    const params = Promise.resolve({ id: "club-1" });
    const response = await GET(request, { params });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toEqual({ error: "Club not found" });
  });

  it("should return 404 for a club in a non-public organization", async () => {
    const mockClub = {
      id: "club-1",
      name: "Test Club",
      isPublic: true,
      organization: {
        isPublic: false,
      },
    };

    (prisma.club.findUnique as jest.Mock).mockResolvedValue(mockClub);

    const request = new Request("http://localhost:3000/api/clubs/club-1");
    const params = Promise.resolve({ id: "club-1" });
    const response = await GET(request, { params });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toEqual({ error: "Club not found" });
  });

  it("should return 404 for a non-existent club", async () => {
    (prisma.club.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new Request("http://localhost:3000/api/clubs/club-999");
    const params = Promise.resolve({ id: "club-999" });
    const response = await GET(request, { params });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toEqual({ error: "Club not found" });
  });

  it("should handle database errors gracefully", async () => {
    (prisma.club.findUnique as jest.Mock).mockRejectedValue(new Error("Database error"));

    const request = new Request("http://localhost:3000/api/clubs/club-1");
    const params = Promise.resolve({ id: "club-1" });
    const response = await GET(request, { params });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: "Internal server error" });
  });
});
