/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { usePlayerClubStore } from "@/stores/usePlayerClubStore";
import ClubDetailPage from "@/app/(pages)/(player)/clubs/[id]/page";

// Mock dependencies
jest.mock("next/navigation", () => ({
  usePathname: () => "/clubs/test-club-id",
}));

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "clubDetail.availableCourts": "Available Courts",
      "common.perHour": "per hour",
      "common.loading": "Loading...",
      "clubs.noCourts": "No courts available",
    };
    return translations[key] || key;
  },
}));

jest.mock("@/stores/useUserStore", () => ({
  useUserStore: (selector: any) => {
    const state = {
      user: null,
      isLoggedIn: false,
    };
    return selector ? selector(state) : state;
  },
}));

jest.mock("@/contexts/ClubContext", () => ({
  useActiveClub: () => ({
    setActiveClubId: jest.fn(),
  }),
}));

// Mock the player club store
jest.mock("@/stores/usePlayerClubStore");

describe("Club Detail Page - Price Range Display", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should display price range when courts have different prices", async () => {
    const mockClub = {
      id: "test-club-id",
      name: "Test Club",
      location: "Test Location",
      city: "Test City",
      country: "Test Country",
    };

    const mockCourts = [
      { id: "court-1", name: "Court 1", indoor: true, defaultPriceCents: 3000 },
      { id: "court-2", name: "Court 2", indoor: false, defaultPriceCents: 5000 },
      { id: "court-3", name: "Court 3", indoor: true, defaultPriceCents: 7000 },
    ];

    (usePlayerClubStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        currentClub: mockClub,
        ensureClubById: jest.fn().mockResolvedValue(mockClub),
        ensureCourtsByClubId: jest.fn().mockResolvedValue(mockCourts),
        ensureGalleryByClubId: jest.fn().mockResolvedValue([]),
        getCourtsForClub: jest.fn(() => mockCourts),
        getGalleryForClub: jest.fn(() => []),
        loadingClubs: false,
        loadingCourts: false,
        clubsError: null,
      };
      return selector(state);
    });

    render(await ClubDetailPage({ params: Promise.resolve({ id: "test-club-id" }) }));

    await waitFor(() => {
      const priceRange = screen.getByTestId("courts-price-range");
      expect(priceRange).toBeInTheDocument();
      expect(priceRange).toHaveTextContent("$30.00 - $70.00 per hour");
    });
  });

  it("should display single price when all courts have the same price", async () => {
    const mockClub = {
      id: "test-club-id",
      name: "Test Club",
      location: "Test Location",
      city: "Test City",
      country: "Test Country",
    };

    const mockCourts = [
      { id: "court-1", name: "Court 1", indoor: true, defaultPriceCents: 5000 },
      { id: "court-2", name: "Court 2", indoor: false, defaultPriceCents: 5000 },
    ];

    (usePlayerClubStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        currentClub: mockClub,
        ensureClubById: jest.fn().mockResolvedValue(mockClub),
        ensureCourtsByClubId: jest.fn().mockResolvedValue(mockCourts),
        ensureGalleryByClubId: jest.fn().mockResolvedValue([]),
        getCourtsForClub: jest.fn(() => mockCourts),
        getGalleryForClub: jest.fn(() => []),
        loadingClubs: false,
        loadingCourts: false,
        clubsError: null,
      };
      return selector(state);
    });

    render(await ClubDetailPage({ params: Promise.resolve({ id: "test-club-id" }) }));

    await waitFor(() => {
      const priceRange = screen.getByTestId("courts-price-range");
      expect(priceRange).toBeInTheDocument();
      expect(priceRange).toHaveTextContent("$50.00 per hour");
    });
  });

  it("should not display price range when there are no courts", async () => {
    const mockClub = {
      id: "test-club-id",
      name: "Test Club",
      location: "Test Location",
      city: "Test City",
      country: "Test Country",
    };

    (usePlayerClubStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        currentClub: mockClub,
        ensureClubById: jest.fn().mockResolvedValue(mockClub),
        ensureCourtsByClubId: jest.fn().mockResolvedValue([]),
        ensureGalleryByClubId: jest.fn().mockResolvedValue([]),
        getCourtsForClub: jest.fn(() => []),
        getGalleryForClub: jest.fn(() => []),
        loadingClubs: false,
        loadingCourts: false,
        clubsError: null,
      };
      return selector(state);
    });

    render(await ClubDetailPage({ params: Promise.resolve({ id: "test-club-id" }) }));

    await waitFor(() => {
      const noCourtsMessage = screen.getByText("No courts available");
      expect(noCourtsMessage).toBeInTheDocument();
      expect(screen.queryByTestId("courts-price-range")).not.toBeInTheDocument();
    });
  });
});
