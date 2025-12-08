/**
 * Mock data for Organization Dashboard page
 * Used when NEXT_PUBLIC_USE_MOCKS=true (dev only)
 */

import type { OrgDashboardResponse } from "@/app/api/orgs/[orgId]/dashboard/route";

/**
 * Default mock: A typical organization with several clubs and activity
 */
export const mockOrganizationDetail: OrgDashboardResponse = {
  org: {
    id: "mock-org-001",
    name: "Elite Padel Network",
    slug: "elite-padel-network",
  },
  metrics: {
    clubsCount: 12,
    courtsCount: 48,
    bookingsToday: 87,
    clubAdminsCount: 24,
  },
};

/**
 * Variant: New organization with minimal data
 */
export const mockOrganizationWithNoClubs: OrgDashboardResponse = {
  org: {
    id: "mock-org-002",
    name: "Startup Padel Co",
    slug: "startup-padel-co",
  },
  metrics: {
    clubsCount: 0,
    courtsCount: 0,
    bookingsToday: 0,
    clubAdminsCount: 1,
  },
};

/**
 * Variant: Large organization with many clubs
 */
export const mockOrganizationWithManyClubs: OrgDashboardResponse = {
  org: {
    id: "mock-org-003",
    name: "Global Padel Enterprise",
    slug: "global-padel-enterprise",
  },
  metrics: {
    clubsCount: 156,
    courtsCount: 624,
    bookingsToday: 1247,
    clubAdminsCount: 312,
  },
};
