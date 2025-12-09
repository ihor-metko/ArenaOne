/**
 * Mock data for Organization Detail page
 * 
 * Provides realistic organization detail payloads for development.
 * Includes nested structures for clubs, admins, activity, and users.
 */

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface SuperAdmin extends User {
  isPrimaryOwner: boolean;
  membershipId: string;
}

interface ClubAdmin {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  clubId: string;
  clubName: string;
}

interface ClubPreview {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  isPublic: boolean;
  courtCount: number;
  adminCount: number;
  createdAt: string;
}

interface ActivityItem {
  id: string;
  action: string;
  actor: { id: string; name: string | null; email: string | null };
  detail: Record<string, unknown> | null;
  createdAt: string;
}

interface UserPreview {
  id: string;
  name: string | null;
  email: string;
  lastLoginAt: string | null;
  lastBookingAt: string;
}

export interface OrgDetail {
  id: string;
  name: string;
  slug: string;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  address: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: User;
  superAdmins: SuperAdmin[];
  primaryOwner: SuperAdmin | null;
  metrics: {
    totalClubs: number;
    totalCourts: number;
    activeBookings: number;
    activeUsers: number;
  };
  clubsPreview: ClubPreview[];
  clubAdmins: ClubAdmin[];
  recentActivity: ActivityItem[];
}

export interface UsersPreviewData {
  items: UserPreview[];
  summary: { totalUsers: number; activeToday: number };
}

/**
 * Variant 1: Large active organization with multiple clubs
 */
export const mockOrganizationDetailLarge: OrgDetail = {
  id: "org-mock-1",
  name: "Elite Padel Network",
  slug: "elite-padel-network",
  contactEmail: "contact@elitepadel.com",
  contactPhone: "+1 555-0123",
  website: "https://elitepadel.com",
  address: "123 Sports Avenue, Los Angeles, CA 90001",
  archivedAt: null,
  createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  createdBy: {
    id: "user-creator-1",
    name: "Sarah Johnson",
    email: "sarah.johnson@elitepadel.com",
  },
  superAdmins: [
    {
      id: "user-admin-1",
      name: "Sarah Johnson",
      email: "sarah.johnson@elitepadel.com",
      isPrimaryOwner: true,
      membershipId: "membership-1",
    },
    {
      id: "user-admin-2",
      name: "Michael Chen",
      email: "michael.chen@elitepadel.com",
      isPrimaryOwner: false,
      membershipId: "membership-2",
    },
    {
      id: "user-admin-3",
      name: "Emma Rodriguez",
      email: "emma.rodriguez@elitepadel.com",
      isPrimaryOwner: false,
      membershipId: "membership-3",
    },
  ],
  primaryOwner: {
    id: "user-admin-1",
    name: "Sarah Johnson",
    email: "sarah.johnson@elitepadel.com",
    isPrimaryOwner: true,
    membershipId: "membership-1",
  },
  metrics: {
    totalClubs: 5,
    totalCourts: 18,
    activeBookings: 127,
    activeUsers: 342,
  },
  clubsPreview: [
    {
      id: "club-mock-1",
      name: "Downtown Padel Club",
      slug: "downtown-padel",
      city: "Los Angeles",
      isPublic: true,
      courtCount: 4,
      adminCount: 2,
      createdAt: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "club-mock-2",
      name: "Westside Padel Center",
      slug: "westside-padel",
      city: "Santa Monica",
      isPublic: true,
      courtCount: 5,
      adminCount: 3,
      createdAt: new Date(Date.now() - 250 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "club-mock-3",
      name: "Valley Padel Academy",
      slug: "valley-padel",
      city: "San Fernando Valley",
      isPublic: true,
      courtCount: 3,
      adminCount: 1,
      createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "club-mock-4",
      name: "Beach Padel Resort",
      slug: "beach-padel",
      city: "Malibu",
      isPublic: true,
      courtCount: 4,
      adminCount: 2,
      createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "club-mock-5",
      name: "Premium Padel Club",
      slug: "premium-padel",
      city: "Beverly Hills",
      isPublic: false,
      courtCount: 2,
      adminCount: 1,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  clubAdmins: [
    {
      id: "club-admin-1",
      userId: "user-club-admin-1",
      userName: "David Martinez",
      userEmail: "david.martinez@example.com",
      clubId: "club-mock-1",
      clubName: "Downtown Padel Club",
    },
    {
      id: "club-admin-2",
      userId: "user-club-admin-2",
      userName: "Lisa Anderson",
      userEmail: "lisa.anderson@example.com",
      clubId: "club-mock-1",
      clubName: "Downtown Padel Club",
    },
    {
      id: "club-admin-3",
      userId: "user-club-admin-3",
      userName: "Carlos Ruiz",
      userEmail: "carlos.ruiz@example.com",
      clubId: "club-mock-2",
      clubName: "Westside Padel Center",
    },
    {
      id: "club-admin-4",
      userId: "user-club-admin-4",
      userName: "Anna Kim",
      userEmail: "anna.kim@example.com",
      clubId: "club-mock-2",
      clubName: "Westside Padel Center",
    },
    {
      id: "club-admin-5",
      userId: "user-club-admin-5",
      userName: "James Wilson",
      userEmail: "james.wilson@example.com",
      clubId: "club-mock-2",
      clubName: "Westside Padel Center",
    },
  ],
  recentActivity: [
    {
      id: "activity-1",
      action: "org.update",
      actor: {
        id: "user-admin-1",
        name: "Sarah Johnson",
        email: "sarah.johnson@elitepadel.com",
      },
      detail: { field: "contactEmail", oldValue: "info@elitepadel.com", newValue: "contact@elitepadel.com" },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-2",
      action: "org.assign_admin",
      actor: {
        id: "user-admin-1",
        name: "Sarah Johnson",
        email: "sarah.johnson@elitepadel.com",
      },
      detail: { adminEmail: "emma.rodriguez@elitepadel.com" },
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-3",
      action: "org.update",
      actor: {
        id: "user-admin-2",
        name: "Michael Chen",
        email: "michael.chen@elitepadel.com",
      },
      detail: { field: "website", newValue: "https://elitepadel.com" },
      createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-4",
      action: "org.assign_admin",
      actor: {
        id: "user-admin-1",
        name: "Sarah Johnson",
        email: "sarah.johnson@elitepadel.com",
      },
      detail: { adminEmail: "michael.chen@elitepadel.com" },
      createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-5",
      action: "org.create",
      actor: {
        id: "user-admin-1",
        name: "Sarah Johnson",
        email: "sarah.johnson@elitepadel.com",
      },
      detail: null,
      createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

/**
 * Variant 2: Medium organization with fewer clubs
 */
export const mockOrganizationDetailMedium: OrgDetail = {
  id: "org-mock-2",
  name: "Urban Padel Group",
  slug: "urban-padel",
  contactEmail: "info@urbanpadel.com",
  contactPhone: "+1 555-0456",
  website: "https://urbanpadel.com",
  address: "456 City Center, San Francisco, CA 94102",
  archivedAt: null,
  createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  createdBy: {
    id: "user-creator-2",
    name: "Robert Taylor",
    email: "robert.taylor@urbanpadel.com",
  },
  superAdmins: [
    {
      id: "user-admin-4",
      name: "Robert Taylor",
      email: "robert.taylor@urbanpadel.com",
      isPrimaryOwner: true,
      membershipId: "membership-4",
    },
    {
      id: "user-admin-5",
      name: "Jennifer Lee",
      email: "jennifer.lee@urbanpadel.com",
      isPrimaryOwner: false,
      membershipId: "membership-5",
    },
  ],
  primaryOwner: {
    id: "user-admin-4",
    name: "Robert Taylor",
    email: "robert.taylor@urbanpadel.com",
    isPrimaryOwner: true,
    membershipId: "membership-4",
  },
  metrics: {
    totalClubs: 2,
    totalCourts: 7,
    activeBookings: 45,
    activeUsers: 128,
  },
  clubsPreview: [
    {
      id: "club-mock-6",
      name: "Mission District Padel",
      slug: "mission-padel",
      city: "San Francisco",
      isPublic: true,
      courtCount: 4,
      adminCount: 2,
      createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "club-mock-7",
      name: "Marina Padel Club",
      slug: "marina-padel",
      city: "San Francisco",
      isPublic: true,
      courtCount: 3,
      adminCount: 1,
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  clubAdmins: [
    {
      id: "club-admin-6",
      userId: "user-club-admin-6",
      userName: "Marcus Thompson",
      userEmail: "marcus.thompson@example.com",
      clubId: "club-mock-6",
      clubName: "Mission District Padel",
    },
    {
      id: "club-admin-7",
      userId: "user-club-admin-7",
      userName: "Sofia Garcia",
      userEmail: "sofia.garcia@example.com",
      clubId: "club-mock-6",
      clubName: "Mission District Padel",
    },
    {
      id: "club-admin-8",
      userId: "user-club-admin-8",
      userName: "Alex Brown",
      userEmail: "alex.brown@example.com",
      clubId: "club-mock-7",
      clubName: "Marina Padel Club",
    },
  ],
  recentActivity: [
    {
      id: "activity-6",
      action: "org.update",
      actor: {
        id: "user-admin-4",
        name: "Robert Taylor",
        email: "robert.taylor@urbanpadel.com",
      },
      detail: { field: "contactPhone", newValue: "+1 555-0456" },
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-7",
      action: "org.assign_admin",
      actor: {
        id: "user-admin-4",
        name: "Robert Taylor",
        email: "robert.taylor@urbanpadel.com",
      },
      detail: { adminEmail: "jennifer.lee@urbanpadel.com" },
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-8",
      action: "org.create",
      actor: {
        id: "user-admin-4",
        name: "Robert Taylor",
        email: "robert.taylor@urbanpadel.com",
      },
      detail: null,
      createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

/**
 * Variant 3: Small startup organization with single club
 */
export const mockOrganizationDetailSmall: OrgDetail = {
  id: "org-mock-3",
  name: "Neighborhood Padel Co",
  slug: "neighborhood-padel",
  contactEmail: "hello@neighborhoodpadel.com",
  contactPhone: null,
  website: null,
  address: "789 Community Street, Austin, TX 78701",
  archivedAt: null,
  createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  createdBy: {
    id: "user-creator-3",
    name: "Amy Parker",
    email: "amy.parker@neighborhoodpadel.com",
  },
  superAdmins: [
    {
      id: "user-admin-6",
      name: "Amy Parker",
      email: "amy.parker@neighborhoodpadel.com",
      isPrimaryOwner: true,
      membershipId: "membership-6",
    },
  ],
  primaryOwner: {
    id: "user-admin-6",
    name: "Amy Parker",
    email: "amy.parker@neighborhoodpadel.com",
    isPrimaryOwner: true,
    membershipId: "membership-6",
  },
  metrics: {
    totalClubs: 1,
    totalCourts: 3,
    activeBookings: 18,
    activeUsers: 42,
  },
  clubsPreview: [
    {
      id: "club-mock-8",
      name: "East Austin Padel",
      slug: "east-austin-padel",
      city: "Austin",
      isPublic: true,
      courtCount: 3,
      adminCount: 1,
      createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  clubAdmins: [
    {
      id: "club-admin-9",
      userId: "user-club-admin-9",
      userName: "Tom Henderson",
      userEmail: "tom.henderson@example.com",
      clubId: "club-mock-8",
      clubName: "East Austin Padel",
    },
  ],
  recentActivity: [
    {
      id: "activity-9",
      action: "org.update",
      actor: {
        id: "user-admin-6",
        name: "Amy Parker",
        email: "amy.parker@neighborhoodpadel.com",
      },
      detail: { field: "address", newValue: "789 Community Street, Austin, TX 78701" },
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-10",
      action: "org.create",
      actor: {
        id: "user-admin-6",
        name: "Amy Parker",
        email: "amy.parker@neighborhoodpadel.com",
      },
      detail: null,
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

/**
 * Users preview mock data for the large organization
 */
export const mockUsersPreviewLarge: UsersPreviewData = {
  items: [
    {
      id: "user-player-1",
      name: "John Smith",
      email: "john.smith@example.com",
      lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      lastBookingAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "user-player-2",
      name: "Maria Gonzalez",
      email: "maria.gonzalez@example.com",
      lastLoginAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      lastBookingAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "user-player-3",
      name: "Kevin Wu",
      email: "kevin.wu@example.com",
      lastLoginAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      lastBookingAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "user-player-4",
      name: null,
      email: "player4@example.com",
      lastLoginAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      lastBookingAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "user-player-5",
      name: "Patricia Davis",
      email: "patricia.davis@example.com",
      lastLoginAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      lastBookingAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    },
  ],
  summary: {
    totalUsers: 342,
    activeToday: 28,
  },
};

/**
 * Users preview mock data for medium organization
 */
export const mockUsersPreviewMedium: UsersPreviewData = {
  items: [
    {
      id: "user-player-6",
      name: "Ryan Miller",
      email: "ryan.miller@example.com",
      lastLoginAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      lastBookingAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "user-player-7",
      name: "Laura Scott",
      email: "laura.scott@example.com",
      lastLoginAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      lastBookingAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "user-player-8",
      name: "Daniel Park",
      email: "daniel.park@example.com",
      lastLoginAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
      lastBookingAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    },
  ],
  summary: {
    totalUsers: 128,
    activeToday: 12,
  },
};

/**
 * Users preview mock data for small organization
 */
export const mockUsersPreviewSmall: UsersPreviewData = {
  items: [
    {
      id: "user-player-9",
      name: "Chris Johnson",
      email: "chris.johnson@example.com",
      lastLoginAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      lastBookingAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "user-player-10",
      name: "Nina Patel",
      email: "nina.patel@example.com",
      lastLoginAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      lastBookingAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  summary: {
    totalUsers: 42,
    activeToday: 5,
  },
};

/**
 * Get mock organization detail based on orgId
 * Returns different variants based on the ID pattern
 */
export function getMockOrganizationDetail(orgId: string): OrgDetail {
  // Use different variants based on orgId for variety
  if (orgId.includes("2") || orgId.includes("medium")) {
    return mockOrganizationDetailMedium;
  } else if (orgId.includes("3") || orgId.includes("small")) {
    return mockOrganizationDetailSmall;
  }
  // Default to large variant
  return mockOrganizationDetailLarge;
}

/**
 * Get mock users preview based on orgId
 */
export function getMockUsersPreview(orgId: string): UsersPreviewData {
  if (orgId.includes("2") || orgId.includes("medium")) {
    return mockUsersPreviewMedium;
  } else if (orgId.includes("3") || orgId.includes("small")) {
    return mockUsersPreviewSmall;
  }
  return mockUsersPreviewLarge;
}
