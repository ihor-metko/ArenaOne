/**
 * Mock data for Booking Detail
 * Used when NEXT_PUBLIC_USE_MOCKS=true (dev only)
 */

import type { AdminBookingDetailResponse } from "@/app/api/admin/bookings/[id]/route";

/**
 * Default mock: Complete paid booking with payment history
 */
export const mockBookingDetail: AdminBookingDetailResponse = {
  id: "mock-booking-001",
  userId: "mock-user-001",
  userName: "John Smith",
  userEmail: "john.smith@example.com",
  courtId: "mock-court-001",
  courtName: "Court 1 - Indoor Premium",
  courtType: "doubles",
  courtSurface: "artificial_grass",
  clubId: "mock-club-001",
  clubName: "Padel Champions Club",
  organizationId: "mock-org-001",
  organizationName: "Elite Padel Network",
  start: "2024-12-10T10:00:00.000Z",
  end: "2024-12-10T11:30:00.000Z",
  status: "paid",
  price: 4500,
  coachId: "mock-coach-001",
  coachName: "Carlos Rodriguez",
  paymentId: "mock-payment-001",
  createdAt: "2024-12-05T15:20:00.000Z",
  payments: [
    {
      id: "mock-payment-001",
      provider: "stripe",
      status: "succeeded",
      amount: 4500,
      createdAt: "2024-12-05T15:25:00.000Z",
    },
  ],
};

/**
 * Variant: Pending booking (unpaid)
 */
export const mockPendingBooking: AdminBookingDetailResponse = {
  id: "mock-booking-002",
  userId: "mock-user-002",
  userName: "Jane Doe",
  userEmail: "jane.doe@example.com",
  courtId: "mock-court-003",
  courtName: "Court 3 - Outdoor",
  courtType: "doubles",
  courtSurface: "concrete",
  clubId: "mock-club-001",
  clubName: "Padel Champions Club",
  organizationId: "mock-org-001",
  organizationName: "Elite Padel Network",
  start: "2024-12-15T14:00:00.000Z",
  end: "2024-12-15T15:30:00.000Z",
  status: "pending",
  price: 3500,
  coachId: null,
  coachName: null,
  paymentId: null,
  createdAt: "2024-12-07T09:30:00.000Z",
  payments: [],
};

/**
 * Variant: Cancelled booking
 */
export const mockCancelledBooking: AdminBookingDetailResponse = {
  id: "mock-booking-003",
  userId: "mock-user-001",
  userName: "John Smith",
  userEmail: "john.smith@example.com",
  courtId: "mock-court-002",
  courtName: "Court 2 - Indoor Premium",
  courtType: "doubles",
  courtSurface: "artificial_grass",
  clubId: "mock-club-001",
  clubName: "Padel Champions Club",
  organizationId: "mock-org-001",
  organizationName: "Elite Padel Network",
  start: "2024-12-08T18:00:00.000Z",
  end: "2024-12-08T19:30:00.000Z",
  status: "cancelled",
  price: 4500,
  coachId: null,
  coachName: null,
  paymentId: "mock-payment-002",
  createdAt: "2024-12-01T13:20:00.000Z",
  payments: [
    {
      id: "mock-payment-002",
      provider: "stripe",
      status: "refunded",
      amount: 4500,
      createdAt: "2024-12-01T13:25:00.000Z",
    },
  ],
};

/**
 * Variant: Booking with coach and multiple payment attempts
 */
export const mockBookingWithCoach: AdminBookingDetailResponse = {
  id: "mock-booking-004",
  userId: "mock-user-003",
  userName: "Alex Johnson",
  userEmail: "alex.johnson@example.com",
  courtId: "mock-court-001",
  courtName: "Court 1 - Indoor Premium",
  courtType: "singles",
  courtSurface: "artificial_grass",
  clubId: "mock-club-001",
  clubName: "Padel Champions Club",
  organizationId: "mock-org-001",
  organizationName: "Elite Padel Network",
  start: "2024-12-20T16:00:00.000Z",
  end: "2024-12-20T17:30:00.000Z",
  status: "paid",
  price: 7000,
  coachId: "mock-coach-002",
  coachName: "Maria Garcia",
  paymentId: "mock-payment-005",
  createdAt: "2024-12-10T11:00:00.000Z",
  payments: [
    {
      id: "mock-payment-005",
      provider: "stripe",
      status: "succeeded",
      amount: 7000,
      createdAt: "2024-12-10T11:15:00.000Z",
    },
    {
      id: "mock-payment-004",
      provider: "stripe",
      status: "failed",
      amount: 7000,
      createdAt: "2024-12-10T11:10:00.000Z",
    },
    {
      id: "mock-payment-003",
      provider: "stripe",
      status: "failed",
      amount: 7000,
      createdAt: "2024-12-10T11:05:00.000Z",
    },
  ],
};

/**
 * Variant: Reserved booking (not yet paid)
 */
export const mockReservedBooking: AdminBookingDetailResponse = {
  id: "mock-booking-005",
  userId: "mock-user-004",
  userName: "Sarah Williams",
  userEmail: "sarah.williams@example.com",
  courtId: "mock-court-004",
  courtName: "Court 4 - Outdoor",
  courtType: "doubles",
  courtSurface: "concrete",
  clubId: "mock-club-001",
  clubName: "Padel Champions Club",
  organizationId: "mock-org-001",
  organizationName: "Elite Padel Network",
  start: "2024-12-18T10:00:00.000Z",
  end: "2024-12-18T11:30:00.000Z",
  status: "reserved",
  price: 3500,
  coachId: null,
  coachName: null,
  paymentId: null,
  createdAt: "2024-12-08T14:20:00.000Z",
  payments: [],
};

/**
 * Variant: Booking without organization (club-only)
 */
export const mockBookingWithoutOrganization: AdminBookingDetailResponse = {
  id: "mock-booking-006",
  userId: "mock-user-005",
  userName: "Mike Brown",
  userEmail: "mike.brown@example.com",
  courtId: "mock-court-010",
  courtName: "Court 1",
  courtType: "doubles",
  courtSurface: "artificial_grass",
  clubId: "mock-club-independent",
  clubName: "Independent Padel Club",
  organizationId: null,
  organizationName: null,
  start: "2024-12-12T12:00:00.000Z",
  end: "2024-12-12T13:30:00.000Z",
  status: "paid",
  price: 4000,
  coachId: null,
  coachName: null,
  paymentId: "mock-payment-006",
  createdAt: "2024-12-08T10:00:00.000Z",
  payments: [
    {
      id: "mock-payment-006",
      provider: "paypal",
      status: "succeeded",
      amount: 4000,
      createdAt: "2024-12-08T10:05:00.000Z",
    },
  ],
};
