/**
 * Mock data for User Detail page
 * Used when NEXT_PUBLIC_USE_MOCKS=true (dev only)
 */

/**
 * UserDetailData interface (from user detail page)
 */
interface UserDetailData {
  id: string;
  name: string | null;
  email: string;
  status?: string;
  blocked?: boolean;
  isRoot?: boolean;
  role?: string;
  createdAt?: string;
  lastLoginAt?: string;
  emailVerified?: boolean;
  mfaEnabled?: boolean;
  totalBookings?: number;
  viewScope: "root" | "organization" | "club";
  viewContext?: {
    type: string;
    id: string;
    name?: string;
  };
  allowedActions: {
    canBlock: boolean;
    canUnblock: boolean;
    canDelete: boolean;
    canEditRole: boolean;
    canImpersonate: boolean;
  };
  memberships?: Array<{
    id: string;
    role: string;
    isPrimaryOwner: boolean;
    organization: { id: string; name: string; slug: string };
  }>;
  clubMemberships?: Array<{
    id: string;
    role: string;
    club: { id: string; name: string; slug: string };
  }>;
  bookings?: Array<{
    id: string;
    start: string;
    end: string;
    status: string;
    createdAt: string;
    court: { name: string; club?: { name: string } };
  }>;
  auditSummary?: Array<{
    id: string;
    actorId: string;
    action: string;
    detail: string | null;
    createdAt: string;
  }>;
  lastBookingAt_in_org?: string;
  bookingsCount_in_org?: number;
  roles_in_org?: string[];
  recentBookings_in_org?: Array<{
    id: string;
    start: string;
    end: string;
    status: string;
    createdAt: string;
    court: { name: string; club: { id: string; name: string } };
  }>;
  lastBookingAt_in_club?: string;
  bookings_in_club?: Array<{
    id: string;
    start: string;
    end: string;
    status: string;
    createdAt: string;
    court: { name: string };
  }>;
}

/**
 * Default mock: Active user with full data (root view)
 */
export const mockUserDetail: UserDetailData = {
  id: "mock-user-001",
  name: "John Smith",
  email: "john.smith@example.com",
  status: "active",
  blocked: false,
  isRoot: false,
  role: "user",
  createdAt: "2023-06-15T10:00:00.000Z",
  lastLoginAt: "2024-12-07T14:30:00.000Z",
  emailVerified: true,
  mfaEnabled: false,
  totalBookings: 47,
  viewScope: "root",
  allowedActions: {
    canBlock: true,
    canUnblock: false,
    canDelete: true,
    canEditRole: true,
    canImpersonate: true,
  },
  memberships: [
    {
      id: "mock-membership-001",
      role: "MEMBER",
      isPrimaryOwner: false,
      organization: {
        id: "mock-org-001",
        name: "Elite Padel Network",
        slug: "elite-padel-network",
      },
    },
    {
      id: "mock-membership-002",
      role: "ORGANIZATION_ADMIN",
      isPrimaryOwner: true,
      organization: {
        id: "mock-org-002",
        name: "City Sports Association",
        slug: "city-sports-association",
      },
    },
  ],
  clubMemberships: [
    {
      id: "mock-club-membership-001",
      role: "MEMBER",
      club: {
        id: "mock-club-001",
        name: "Padel Champions Club",
        slug: "padel-champions-club",
      },
    },
    {
      id: "mock-club-membership-002",
      role: "CLUB_ADMIN",
      club: {
        id: "mock-club-005",
        name: "Riverside Padel Center",
        slug: "riverside-padel-center",
      },
    },
  ],
  bookings: [
    {
      id: "mock-booking-001",
      start: "2024-12-10T10:00:00.000Z",
      end: "2024-12-10T11:30:00.000Z",
      status: "paid",
      createdAt: "2024-12-05T15:20:00.000Z",
      court: {
        name: "Court 1 - Indoor Premium",
        club: { name: "Padel Champions Club" },
      },
    },
    {
      id: "mock-booking-002",
      start: "2024-12-12T14:00:00.000Z",
      end: "2024-12-12T15:30:00.000Z",
      status: "paid",
      createdAt: "2024-12-06T09:10:00.000Z",
      court: {
        name: "Court 3 - Outdoor",
        club: { name: "Riverside Padel Center" },
      },
    },
    {
      id: "mock-booking-003",
      start: "2024-12-15T16:00:00.000Z",
      end: "2024-12-15T17:30:00.000Z",
      status: "pending",
      createdAt: "2024-12-07T11:45:00.000Z",
      court: {
        name: "Court 2 - Indoor Premium",
        club: { name: "Padel Champions Club" },
      },
    },
    {
      id: "mock-booking-004",
      start: "2024-12-08T18:00:00.000Z",
      end: "2024-12-08T19:30:00.000Z",
      status: "cancelled",
      createdAt: "2024-12-01T13:20:00.000Z",
      court: {
        name: "Court 5",
        club: { name: "Downtown Sports Complex" },
      },
    },
    {
      id: "mock-booking-005",
      start: "2024-11-28T10:00:00.000Z",
      end: "2024-11-28T11:30:00.000Z",
      status: "paid",
      createdAt: "2024-11-25T16:00:00.000Z",
      court: {
        name: "Court 1",
        club: { name: "Riverside Padel Center" },
      },
    },
  ],
  auditSummary: [
    {
      id: "mock-audit-001",
      actorId: "mock-admin-001",
      action: "USER_CREATED",
      detail: "Account created via registration",
      createdAt: "2023-06-15T10:00:00.000Z",
    },
    {
      id: "mock-audit-002",
      actorId: "mock-user-001",
      action: "EMAIL_VERIFIED",
      detail: null,
      createdAt: "2023-06-15T10:15:00.000Z",
    },
    {
      id: "mock-audit-003",
      actorId: "mock-admin-002",
      action: "ROLE_UPDATED",
      detail: "Promoted to CLUB_ADMIN for Riverside Padel Center",
      createdAt: "2024-03-20T14:00:00.000Z",
    },
    {
      id: "mock-audit-004",
      actorId: "mock-user-001",
      action: "BOOKING_CREATED",
      detail: "Created booking for 2024-12-10",
      createdAt: "2024-12-05T15:20:00.000Z",
    },
    {
      id: "mock-audit-005",
      actorId: "mock-user-001",
      action: "BOOKING_CANCELLED",
      detail: "Cancelled booking for 2024-12-08",
      createdAt: "2024-12-07T09:30:00.000Z",
    },
  ],
};

/**
 * Variant: User with no bookings (new user)
 */
export const mockUserWithNoBookings: UserDetailData = {
  id: "mock-user-002",
  name: "Jane Doe",
  email: "jane.doe@example.com",
  status: "active",
  blocked: false,
  isRoot: false,
  role: "user",
  createdAt: "2024-12-01T08:00:00.000Z",
  lastLoginAt: "2024-12-07T10:00:00.000Z",
  emailVerified: true,
  mfaEnabled: false,
  totalBookings: 0,
  viewScope: "root",
  allowedActions: {
    canBlock: true,
    canUnblock: false,
    canDelete: true,
    canEditRole: true,
    canImpersonate: true,
  },
  memberships: [],
  clubMemberships: [],
  bookings: [],
  auditSummary: [
    {
      id: "mock-audit-010",
      actorId: "mock-admin-001",
      action: "USER_CREATED",
      detail: "Account created via registration",
      createdAt: "2024-12-01T08:00:00.000Z",
    },
  ],
};

/**
 * Variant: Blocked user
 */
export const mockBlockedUser: UserDetailData = {
  ...mockUserDetail,
  id: "mock-user-003",
  name: "Alex Johnson",
  email: "alex.johnson@example.com",
  status: "blocked",
  blocked: true,
  allowedActions: {
    canBlock: false,
    canUnblock: true,
    canDelete: true,
    canEditRole: false,
    canImpersonate: false,
  },
  auditSummary: [
    ...(mockUserDetail.auditSummary || []),
    {
      id: "mock-audit-020",
      actorId: "mock-admin-001",
      action: "USER_BLOCKED",
      detail: "Blocked due to terms violation",
      createdAt: "2024-12-05T16:30:00.000Z",
    },
  ],
};

/**
 * Variant: Organization admin user (organization scope view)
 */
export const mockOrganizationAdminUser: UserDetailData = {
  id: "mock-user-004",
  name: "Sarah Williams",
  email: "sarah.williams@example.com",
  status: "active",
  blocked: false,
  role: "organization_admin",
  viewScope: "organization",
  viewContext: {
    type: "organization",
    id: "mock-org-001",
    name: "Elite Padel Network",
  },
  allowedActions: {
    canBlock: true,
    canUnblock: false,
    canDelete: false,
    canEditRole: false,
    canImpersonate: false,
  },
  lastBookingAt_in_org: "2024-12-06T14:00:00.000Z",
  bookingsCount_in_org: 23,
  roles_in_org: ["MEMBER", "ORGANIZATION_ADMIN"],
  recentBookings_in_org: [
    {
      id: "mock-booking-010",
      start: "2024-12-06T14:00:00.000Z",
      end: "2024-12-06T15:30:00.000Z",
      status: "paid",
      createdAt: "2024-12-03T10:00:00.000Z",
      court: {
        name: "Court 1",
        club: {
          id: "mock-club-001",
          name: "Padel Champions Club",
        },
      },
    },
    {
      id: "mock-booking-011",
      start: "2024-12-03T10:00:00.000Z",
      end: "2024-12-03T11:30:00.000Z",
      status: "paid",
      createdAt: "2024-11-30T15:20:00.000Z",
      court: {
        name: "Court 2",
        club: {
          id: "mock-club-006",
          name: "Elite Center North",
        },
      },
    },
  ],
};

/**
 * Variant: Club admin user (club scope view)
 */
export const mockClubAdminUser: UserDetailData = {
  id: "mock-user-005",
  name: "Mike Brown",
  email: "mike.brown@example.com",
  status: "active",
  blocked: false,
  role: "club_admin",
  viewScope: "club",
  viewContext: {
    type: "club",
    id: "mock-club-001",
    name: "Padel Champions Club",
  },
  allowedActions: {
    canBlock: true,
    canUnblock: false,
    canDelete: false,
    canEditRole: false,
    canImpersonate: false,
  },
  lastBookingAt_in_club: "2024-12-07T16:00:00.000Z",
  bookings_in_club: [
    {
      id: "mock-booking-020",
      start: "2024-12-07T16:00:00.000Z",
      end: "2024-12-07T17:30:00.000Z",
      status: "paid",
      createdAt: "2024-12-05T12:00:00.000Z",
      court: { name: "Court 1 - Indoor Premium" },
    },
    {
      id: "mock-booking-021",
      start: "2024-12-04T14:00:00.000Z",
      end: "2024-12-04T15:30:00.000Z",
      status: "paid",
      createdAt: "2024-12-01T09:30:00.000Z",
      court: { name: "Court 3 - Outdoor" },
    },
  ],
};

/**
 * Variant: Root admin user
 */
export const mockRootAdminUser: UserDetailData = {
  ...mockUserDetail,
  id: "mock-user-root",
  name: "System Administrator",
  email: "admin@padelplatform.com",
  role: "root_admin",
  isRoot: true,
  totalBookings: 0,
  allowedActions: {
    canBlock: false,
    canUnblock: false,
    canDelete: false,
    canEditRole: false,
    canImpersonate: false,
  },
  bookings: [],
};
