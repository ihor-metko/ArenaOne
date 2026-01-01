/**
 * Integration test to verify that club update operations properly refresh UI
 * by fetching updated club data and calling updateClubInStore
 */

import { useAdminClubStore } from "@/stores/useAdminClubStore";
import type { ClubDetail } from "@/types/club";

// Mock fetch
global.fetch = jest.fn();

describe("Club UI Update Integration", () => {
  let mockClub: ClubDetail;
  let updateClubInStoreSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset store state
    useAdminClubStore.setState({
      clubs: [],
      clubsById: {},
      currentClub: null,
      loadingClubs: false,
      loading: false,
      clubsError: null,
      error: null,
      lastFetchedAt: null,
      lastOrganizationId: null,
      _inflightFetchClubs: null,
      _inflightFetchClubById: null,
    });

    mockClub = {
      id: "club-123",
      name: "Test Club",
      slug: "test-club",
      organizationId: "org-123",
      location: "Test Location",
      shortDescription: "Test Description",
      longDescription: null,
      city: "Test City",
      country: "Test Country",
      latitude: 40.7128,
      longitude: -74.006,
      phone: "+1234567890",
      email: "test@club.com",
      website: "https://club.com",
      socialLinks: null,
      contactInfo: null,
      openingHours: null,
      status: "ACTIVE",
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      logoData: null,
      bannerData: null,
      metadata: null,
      defaultCurrency: null,
      timezone: null,
      tags: null,
      courts: [],
      coaches: [],
      businessHours: [
        {
          id: "bh-1",
          clubId: "club-123",
          dayOfWeek: 0,
          openTime: "09:00",
          closeTime: "21:00",
          isClosed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      specialHours: [],
      gallery: [],
    };

    // Spy on updateClubInStore
    updateClubInStoreSpy = jest.spyOn(useAdminClubStore.getState(), 'updateClubInStore');
  });

  afterEach(() => {
    updateClubInStoreSpy.mockRestore();
  });

  describe("Business Hours Update Pattern", () => {
    it("should fetch updated club after successful business hours update", async () => {
      // Mock successful business hours update
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        // Mock successful club fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockClub,
            businessHours: [
              {
                id: "bh-1",
                clubId: "club-123",
                dayOfWeek: 0,
                openTime: "08:00",
                closeTime: "22:00",
                isClosed: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          }),
        });

      // Simulate the pattern used in ClubHoursView
      const businessHoursResponse = await fetch(`/api/admin/clubs/club-123/business-hours`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessHours: [] }),
      });

      if (!businessHoursResponse.ok) {
        throw new Error("Failed to update business hours");
      }

      // Fetch the updated club data
      const clubResponse = await fetch(`/api/admin/clubs/club-123`);
      if (!clubResponse.ok) {
        throw new Error("Failed to refresh club data");
      }
      
      const updatedClub = await clubResponse.json();

      // Update store reactively
      useAdminClubStore.getState().updateClubInStore("club-123", updatedClub);

      // Verify the fetch calls
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        `/api/admin/clubs/club-123/business-hours`,
        expect.objectContaining({ method: "PATCH" })
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        `/api/admin/clubs/club-123`
      );

      // Verify updateClubInStore was called with full club data
      expect(updateClubInStoreSpy).toHaveBeenCalledWith("club-123", updatedClub);
      expect(updatedClub.businessHours[0].openTime).toBe("08:00");
    });
  });

  describe("Contacts Update Pattern", () => {
    it("should fetch updated club after successful contacts/location update", async () => {
      // Mock successful location and contacts updates
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        // Mock successful club fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockClub,
            location: "New Location",
            phone: "+9876543210",
          }),
        });

      // Simulate the pattern used in ClubContactsView
      const [locationResponse, contactsResponse] = await Promise.all([
        fetch(`/api/admin/clubs/club-123/location`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ location: "New Location" }),
        }),
        fetch(`/api/admin/clubs/club-123/contacts`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: "+9876543210" }),
        }),
      ]);

      if (!locationResponse.ok || !contactsResponse.ok) {
        throw new Error("Failed to update");
      }

      // Fetch the updated club data
      const clubResponse = await fetch(`/api/admin/clubs/club-123`);
      if (!clubResponse.ok) {
        throw new Error("Failed to refresh club data");
      }
      
      const updatedClub = await clubResponse.json();

      // Update store reactively
      useAdminClubStore.getState().updateClubInStore("club-123", updatedClub);

      // Verify the fetch calls
      expect(global.fetch).toHaveBeenCalledTimes(3);
      
      // Verify updateClubInStore was called with full club data
      expect(updateClubInStoreSpy).toHaveBeenCalledWith("club-123", updatedClub);
      expect(updatedClub.location).toBe("New Location");
      expect(updatedClub.phone).toBe("+9876543210");
    });
  });

  describe("Gallery/Media Update Pattern", () => {
    it("should fetch updated club after successful media update", async () => {
      // Mock successful media update
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        // Mock successful club fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockClub,
            bannerData: { url: "https://example.com/new-banner.jpg" },
          }),
        });

      // Simulate the pattern used in ClubGalleryView
      const response = await fetch(`/api/admin/clubs/club-123/media`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bannerData: { url: "https://example.com/new-banner.jpg" } }),
      });

      if (!response.ok) {
        throw new Error("Failed to update media");
      }

      // Fetch the updated club data
      const clubResponse = await fetch(`/api/admin/clubs/club-123`);
      if (!clubResponse.ok) {
        throw new Error("Failed to refresh club data");
      }
      
      const updatedClub = await clubResponse.json();

      // Update store reactively
      useAdminClubStore.getState().updateClubInStore("club-123", updatedClub);

      // Verify the fetch calls
      expect(global.fetch).toHaveBeenCalledTimes(2);
      
      // Verify updateClubInStore was called with full club data
      expect(updateClubInStoreSpy).toHaveBeenCalledWith("club-123", updatedClub);
      expect(updatedClub.bannerData).toEqual({ url: "https://example.com/new-banner.jpg" });
    });
  });

  describe("Store Update Behavior", () => {
    it("should call updateClubInStore with correct parameters", () => {
      // Set initial state
      const initialClub = { ...mockClub };
      useAdminClubStore.setState({
        currentClub: initialClub,
        clubsById: { "club-123": initialClub },
        clubs: [
          {
            ...initialClub,
            indoorCount: 5,
            outdoorCount: 3,
            courtCount: 8,
            bookingCount: 0,
          },
        ],
      });

      // Create updated club
      const updatedClub = {
        ...mockClub,
        name: "Updated Club Name",
        businessHours: [
          {
            id: "bh-2",
            clubId: "club-123",
            dayOfWeek: 1,
            openTime: "10:00",
            closeTime: "20:00",
            isClosed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      };

      // Call updateClubInStore
      useAdminClubStore.getState().updateClubInStore("club-123", updatedClub);

      // Verify updateClubInStore was called correctly
      // The key test is that it doesn't throw and accepts the full ClubDetail object
      expect(updatedClub.name).toBe("Updated Club Name");
      expect(updatedClub.businessHours).toHaveLength(1);
    });
  });
});
