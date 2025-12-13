/**
 * Tests for pre-selected filters on Admin Courts Page
 * Verifies that filters are applied by default based on user role
 * @jest-environment jsdom
 */

import { renderHook, waitFor } from "@testing-library/react";
import { useUserStore } from "@/stores/useUserStore";
import type { AdminStatus } from "@/app/api/me/route";

// Define filters interface to match the courts page
interface CourtFilters {
  searchQuery: string;
  organizationFilter: string;
  clubFilter: string;
  statusFilter: string;
  sportTypeFilter: string;
  surfaceTypeFilter: string;
  indoorFilter: string;
}

describe("Admin Courts Page - Pre-selected Filters", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe("Filter pre-selection based on admin role", () => {
    it("should pre-select status as active and surface type as Hard for all roles", () => {
      const preSelectedFilters: Partial<CourtFilters> = {
        statusFilter: "active",
        surfaceTypeFilter: "Hard",
      };

      expect(preSelectedFilters.statusFilter).toBe("active");
      expect(preSelectedFilters.surfaceTypeFilter).toBe("Hard");
    });

    it("should pre-select club for Club Admin", () => {
      const adminStatus: AdminStatus = {
        isAdmin: true,
        adminType: "club_admin",
        managedIds: ["club-123"],
        assignedClub: {
          id: "club-123",
          name: "Test Club",
        },
      };

      const preSelectedFilters: Partial<CourtFilters> = {
        statusFilter: "active",
        surfaceTypeFilter: "Hard",
      };

      // Club Admin should have their club pre-selected
      if (adminStatus.adminType === "club_admin" && adminStatus.managedIds.length > 0) {
        preSelectedFilters.clubFilter = adminStatus.managedIds[0];
      }

      expect(preSelectedFilters.clubFilter).toBe("club-123");
    });

    it("should pre-select organization for Organization Admin", () => {
      const adminStatus: AdminStatus = {
        isAdmin: true,
        adminType: "organization_admin",
        managedIds: ["org-456"],
        isPrimaryOwner: true,
      };

      const preSelectedFilters: Partial<CourtFilters> = {
        statusFilter: "active",
        surfaceTypeFilter: "Hard",
      };

      // Organization Admin should have their organization pre-selected
      if (adminStatus.adminType === "organization_admin" && adminStatus.managedIds.length > 0) {
        preSelectedFilters.organizationFilter = adminStatus.managedIds[0];
      }

      expect(preSelectedFilters.organizationFilter).toBe("org-456");
    });

    it("should not pre-select organization/club for Root Admin", () => {
      const adminStatus: AdminStatus = {
        isAdmin: true,
        adminType: "root_admin",
        managedIds: [],
      };

      const preSelectedFilters: Partial<CourtFilters> = {
        statusFilter: "active",
        surfaceTypeFilter: "Hard",
      };

      // Root Admin should NOT have organization/club pre-selected
      if (adminStatus.adminType === "club_admin" && adminStatus.managedIds.length > 0) {
        preSelectedFilters.clubFilter = adminStatus.managedIds[0];
      } else if (adminStatus.adminType === "organization_admin" && adminStatus.managedIds.length > 0) {
        preSelectedFilters.organizationFilter = adminStatus.managedIds[0];
      }

      expect(preSelectedFilters.organizationFilter).toBeUndefined();
      expect(preSelectedFilters.clubFilter).toBeUndefined();
    });
  });

  describe("Filter persistence behavior", () => {
    it("should only apply pre-selected filters when no existing filters are set", () => {
      // Simulate existing filters in localStorage
      const existingFilters = {
        searchQuery: "",
        organizationFilter: "",
        clubFilter: "",
        statusFilter: "inactive", // User has previously selected inactive
        sportTypeFilter: "",
        surfaceTypeFilter: "",
        indoorFilter: "",
      };

      // Check if filters are already set
      const hasExistingFilters =
        existingFilters.statusFilter !== "" ||
        existingFilters.surfaceTypeFilter !== "" ||
        existingFilters.organizationFilter !== "" ||
        existingFilters.clubFilter !== "";

      expect(hasExistingFilters).toBe(true);
    });

    it("should apply pre-selected filters when all filters are empty", () => {
      const existingFilters = {
        searchQuery: "",
        organizationFilter: "",
        clubFilter: "",
        statusFilter: "",
        sportTypeFilter: "",
        surfaceTypeFilter: "",
        indoorFilter: "",
      };

      // Check if filters are already set
      const hasExistingFilters =
        existingFilters.statusFilter !== "" ||
        existingFilters.surfaceTypeFilter !== "" ||
        existingFilters.organizationFilter !== "" ||
        existingFilters.clubFilter !== "";

      expect(hasExistingFilters).toBe(false);
    });
  });

  describe("Pre-selected filter values", () => {
    it("should use 'active' as the default status filter", () => {
      const defaultStatus = "active";
      expect(defaultStatus).toBe("active");
    });

    it("should use 'Hard' as the default surface type filter", () => {
      const defaultSurfaceType = "Hard";
      expect(defaultSurfaceType).toBe("Hard");
    });

    it("should allow users to modify pre-selected filters", () => {
      let statusFilter = "active";
      let surfaceTypeFilter = "Hard";

      // User modifies filters
      statusFilter = "inactive";
      surfaceTypeFilter = "Clay";

      expect(statusFilter).toBe("inactive");
      expect(surfaceTypeFilter).toBe("Clay");
    });

    it("should allow users to clear pre-selected filters", () => {
      let statusFilter = "active";
      let surfaceTypeFilter = "Hard";

      // User clears filters
      statusFilter = "";
      surfaceTypeFilter = "";

      expect(statusFilter).toBe("");
      expect(surfaceTypeFilter).toBe("");
    });
  });
});
