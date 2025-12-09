/**
 * Tests for Organization Detail page mocks
 */

import { useMocks } from "@/mocks";
import {
  getMockOrganizationDetail,
  getMockUsersPreview,
  mockOrganizationDetailLarge,
  mockOrganizationDetailMedium,
  mockOrganizationDetailSmall,
} from "@/mocks/admin/organization-detail";

describe("Organization Detail Mocks", () => {
  describe("useMocks helper", () => {
    it("should return false when NEXT_PUBLIC_USE_MOCKS is not set", () => {
      const originalEnv = process.env.NEXT_PUBLIC_USE_MOCKS;
      delete process.env.NEXT_PUBLIC_USE_MOCKS;
      
      expect(useMocks()).toBe(false);
      
      process.env.NEXT_PUBLIC_USE_MOCKS = originalEnv;
    });

    it("should return true when NEXT_PUBLIC_USE_MOCKS is 'true'", () => {
      const originalEnv = process.env.NEXT_PUBLIC_USE_MOCKS;
      process.env.NEXT_PUBLIC_USE_MOCKS = "true";
      
      expect(useMocks()).toBe(true);
      
      process.env.NEXT_PUBLIC_USE_MOCKS = originalEnv;
    });

    it("should return false when NEXT_PUBLIC_USE_MOCKS is any other value", () => {
      const originalEnv = process.env.NEXT_PUBLIC_USE_MOCKS;
      process.env.NEXT_PUBLIC_USE_MOCKS = "false";
      
      expect(useMocks()).toBe(false);
      
      process.env.NEXT_PUBLIC_USE_MOCKS = originalEnv;
    });
  });

  describe("Mock variants", () => {
    it("should have large organization variant with complete data", () => {
      expect(mockOrganizationDetailLarge).toBeDefined();
      expect(mockOrganizationDetailLarge.id).toBe("org-mock-1");
      expect(mockOrganizationDetailLarge.name).toBe("Elite Padel Network");
      expect(mockOrganizationDetailLarge.superAdmins.length).toBeGreaterThan(0);
      expect(mockOrganizationDetailLarge.clubsPreview.length).toBe(5);
      expect(mockOrganizationDetailLarge.metrics.totalClubs).toBe(5);
      expect(mockOrganizationDetailLarge.clubAdmins.length).toBeGreaterThan(0);
      expect(mockOrganizationDetailLarge.recentActivity.length).toBeGreaterThan(0);
    });

    it("should have medium organization variant", () => {
      expect(mockOrganizationDetailMedium).toBeDefined();
      expect(mockOrganizationDetailMedium.id).toBe("org-mock-2");
      expect(mockOrganizationDetailMedium.clubsPreview.length).toBe(2);
      expect(mockOrganizationDetailMedium.metrics.totalClubs).toBe(2);
    });

    it("should have small organization variant", () => {
      expect(mockOrganizationDetailSmall).toBeDefined();
      expect(mockOrganizationDetailSmall.id).toBe("org-mock-3");
      expect(mockOrganizationDetailSmall.clubsPreview.length).toBe(1);
      expect(mockOrganizationDetailSmall.metrics.totalClubs).toBe(1);
    });
  });

  describe("getMockOrganizationDetail", () => {
    it("should return large variant by default", () => {
      const result = getMockOrganizationDetail("org-1");
      expect(result).toEqual(mockOrganizationDetailLarge);
    });

    it("should return medium variant for IDs containing '2' or 'medium'", () => {
      const result1 = getMockOrganizationDetail("org-2");
      expect(result1).toEqual(mockOrganizationDetailMedium);
      
      const result2 = getMockOrganizationDetail("org-medium-test");
      expect(result2).toEqual(mockOrganizationDetailMedium);
    });

    it("should return small variant for IDs containing '3' or 'small'", () => {
      const result1 = getMockOrganizationDetail("org-3");
      expect(result1).toEqual(mockOrganizationDetailSmall);
      
      const result2 = getMockOrganizationDetail("org-small-test");
      expect(result2).toEqual(mockOrganizationDetailSmall);
    });
  });

  describe("getMockUsersPreview", () => {
    it("should return users preview for large org by default", () => {
      const result = getMockUsersPreview("org-1");
      expect(result.items.length).toBe(5);
      expect(result.summary.totalUsers).toBe(342);
      expect(result.summary.activeToday).toBe(28);
    });

    it("should return users preview for medium org", () => {
      const result = getMockUsersPreview("org-2");
      expect(result.items.length).toBe(3);
      expect(result.summary.totalUsers).toBe(128);
    });

    it("should return users preview for small org", () => {
      const result = getMockUsersPreview("org-3");
      expect(result.items.length).toBe(2);
      expect(result.summary.totalUsers).toBe(42);
    });
  });

  describe("Mock data structure", () => {
    it("should have primary owner designated", () => {
      const primaryOwner = mockOrganizationDetailLarge.primaryOwner;
      expect(primaryOwner).toBeDefined();
      expect(primaryOwner?.isPrimaryOwner).toBe(true);
      
      const matchingAdmin = mockOrganizationDetailLarge.superAdmins.find(
        (admin) => admin.id === primaryOwner?.id
      );
      expect(matchingAdmin?.isPrimaryOwner).toBe(true);
    });

    it("should have clubs with court counts", () => {
      mockOrganizationDetailLarge.clubsPreview.forEach((club) => {
        expect(club.courtCount).toBeGreaterThan(0);
        expect(typeof club.name).toBe("string");
        expect(typeof club.slug).toBe("string");
      });
    });

    it("should have club admins with club assignments", () => {
      mockOrganizationDetailLarge.clubAdmins.forEach((admin) => {
        expect(admin.clubId).toBeDefined();
        expect(admin.clubName).toBeDefined();
        expect(admin.userEmail).toBeDefined();
      });
    });

    it("should have recent activity with actors", () => {
      mockOrganizationDetailLarge.recentActivity.forEach((activity) => {
        expect(activity.action).toBeDefined();
        expect(activity.actor).toBeDefined();
        expect(activity.actor.id).toBeDefined();
        expect(activity.createdAt).toBeDefined();
      });
    });

    it("should have valid ISO date strings", () => {
      const org = mockOrganizationDetailLarge;
      expect(new Date(org.createdAt).toISOString()).toBe(org.createdAt);
      expect(new Date(org.updatedAt).toISOString()).toBe(org.updatedAt);
      
      org.recentActivity.forEach((activity) => {
        expect(new Date(activity.createdAt).toISOString()).toBe(activity.createdAt);
      });
    });
  });
});
