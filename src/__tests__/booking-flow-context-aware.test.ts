/**
 * Tests for context-aware booking flow
 * 
 * Validates that the booking wizard correctly adapts its step visibility
 * based on the context (Operations page vs Bookings page)
 */

import {
  getVisibleSteps,
  getFirstVisibleStepId,
  AdminType,
  PredefinedData,
} from "@/components/AdminQuickBookingWizard/types";

describe("Booking Flow - Context Aware Step Visibility", () => {
  describe("Operations Page Context (Club Context)", () => {
    it("should show dateTime as first step when org+club are preselected for Club Admin", () => {
      const adminType: AdminType = "club_admin";
      const predefinedData: PredefinedData = {
        organizationId: "org1",
        clubId: "club1",
      };

      const visibleSteps = getVisibleSteps(adminType, predefinedData);
      const firstStepId = getFirstVisibleStepId(adminType, predefinedData);

      // Should not show org/club steps (hidden)
      expect(visibleSteps.find(s => s.label === "organization")).toBeUndefined();
      expect(visibleSteps.find(s => s.label === "club")).toBeUndefined();
      
      // Should show dateTime as first step
      expect(visibleSteps[0].label).toBe("dateTime");
      expect(firstStepId).toBe(3); // Step 3 is dateTime
    });

    it("should STILL show dateTime as first step even when slot data is prefilled", () => {
      const adminType: AdminType = "club_admin";
      const predefinedData: PredefinedData = {
        organizationId: "org1",
        clubId: "club1",
        date: "2025-01-15",
        startTime: "10:00",
        duration: 60,
        courtId: "court1",
      };

      const visibleSteps = getVisibleSteps(adminType, predefinedData);
      const firstStepId = getFirstVisibleStepId(adminType, predefinedData);

      // Should STILL show dateTime step (allowing user to adjust time)
      expect(visibleSteps.find(s => s.label === "dateTime")).toBeDefined();
      expect(visibleSteps[0].label).toBe("dateTime");
      expect(firstStepId).toBe(3); // Step 3 is dateTime
      
      // Court step should be hidden since courtId is prefilled
      expect(visibleSteps.find(s => s.label === "selectCourt")).toBeUndefined();
    });

    it("should show dateTime as first step for Org Admin with both org+club preselected", () => {
      const adminType: AdminType = "organization_admin";
      const predefinedData: PredefinedData = {
        organizationId: "org1",
        clubId: "club1",
      };

      const visibleSteps = getVisibleSteps(adminType, predefinedData);
      const firstStepId = getFirstVisibleStepId(adminType, predefinedData);

      expect(visibleSteps[0].label).toBe("dateTime");
      expect(firstStepId).toBe(3);
    });

    it("should show dateTime as first step for Root Admin with org+club preselected", () => {
      const adminType: AdminType = "root_admin";
      const predefinedData: PredefinedData = {
        organizationId: "org1",
        clubId: "club1",
      };

      const visibleSteps = getVisibleSteps(adminType, predefinedData);
      const firstStepId = getFirstVisibleStepId(adminType, predefinedData);

      expect(visibleSteps[0].label).toBe("dateTime");
      expect(firstStepId).toBe(3);
    });
  });

  describe("Bookings Page Context (General Flow)", () => {
    it("should show organization as first step for Root Admin with no predefined data", () => {
      const adminType: AdminType = "root_admin";
      const predefinedData: PredefinedData = {};

      const visibleSteps = getVisibleSteps(adminType, predefinedData);
      const firstStepId = getFirstVisibleStepId(adminType, predefinedData);

      expect(visibleSteps[0].label).toBe("organization");
      expect(firstStepId).toBe(1); // Step 1 is organization
      
      // Should show all steps
      expect(visibleSteps.map(s => s.label)).toEqual([
        "organization",
        "club",
        "dateTime",
        "selectCourt",
        "user",
        "confirmation",
      ]);
    });

    it("should show club as first step for Org Admin with only org preselected", () => {
      const adminType: AdminType = "organization_admin";
      const predefinedData: PredefinedData = {
        organizationId: "org1",
      };

      const visibleSteps = getVisibleSteps(adminType, predefinedData);
      const firstStepId = getFirstVisibleStepId(adminType, predefinedData);

      expect(visibleSteps[0].label).toBe("club");
      expect(firstStepId).toBe(2); // Step 2 is club
      
      // Should not show org step (preselected)
      expect(visibleSteps.find(s => s.label === "organization")).toBeUndefined();
    });

    it("should show all steps except org for Org Admin with no predefined data", () => {
      const adminType: AdminType = "organization_admin";
      const predefinedData: PredefinedData = {};

      const visibleSteps = getVisibleSteps(adminType, predefinedData);

      // Org Admin never sees organization step (it's always preselected by managedIds)
      expect(visibleSteps.find(s => s.label === "organization")).toBeUndefined();
      
      expect(visibleSteps[0].label).toBe("club");
    });
  });

  describe("Step Visibility Rules", () => {
    it("should hide confirmation step never (always shown)", () => {
      const adminType: AdminType = "root_admin";
      const predefinedData: PredefinedData = {
        organizationId: "org1",
        clubId: "club1",
        date: "2025-01-15",
        startTime: "10:00",
        duration: 60,
        courtId: "court1",
        userId: "user1",
      };

      const visibleSteps = getVisibleSteps(adminType, predefinedData);
      
      // Confirmation should always be present
      expect(visibleSteps.find(s => s.label === "confirmation")).toBeDefined();
      expect(visibleSteps[visibleSteps.length - 1].label).toBe("confirmation");
    });

    it("should hide user step when userId is prefilled", () => {
      const adminType: AdminType = "root_admin";
      const predefinedData: PredefinedData = {
        organizationId: "org1",
        clubId: "club1",
        userId: "user1",
      };

      const visibleSteps = getVisibleSteps(adminType, predefinedData);
      
      expect(visibleSteps.find(s => s.label === "user")).toBeUndefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined predefinedData", () => {
      const adminType: AdminType = "root_admin";

      const visibleSteps = getVisibleSteps(adminType, undefined);
      const firstStepId = getFirstVisibleStepId(adminType, undefined);

      expect(visibleSteps[0].label).toBe("organization");
      expect(firstStepId).toBe(1);
    });

    it("should handle partial date/time data in general flow", () => {
      const adminType: AdminType = "root_admin";
      const predefinedData: PredefinedData = {
        date: "2025-01-15",
        // Missing startTime and duration
      };

      const visibleSteps = getVisibleSteps(adminType, predefinedData);
      
      // dateTime step should still be shown since not all fields are present
      expect(visibleSteps.find(s => s.label === "dateTime")).toBeDefined();
    });
  });
});
