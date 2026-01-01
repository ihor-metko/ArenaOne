/**
 * @jest-environment node
 */

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    club: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    clubBusinessHours: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    clubSpecialHours: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    clubGallery: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    coach: {
      updateMany: jest.fn(),
    },
    membership: {
      findMany: jest.fn(),
    },
    clubMembership: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Mock auth function
const mockAuth = jest.fn();
jest.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

import { PATCH } from "@/app/api/admin/clubs/[id]/section/route";
import { prisma } from "@/lib/prisma";

describe("Club Section Update Permissions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: non-admin user has no memberships
    (prisma.membership.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.clubMembership.findMany as jest.Mock).mockResolvedValue([]);
  });

  const mockClub = {
    id: "club-123",
    name: "Test Club",
    slug: "test-club",
    shortDescription: "A test club",
    location: "123 Test Street",
    isPublic: true,
    organizationId: "org-123",
    courts: [],
    coaches: [],
    gallery: [],
    businessHours: [],
    specialHours: [],
  };

  const mockParams = Promise.resolve({ id: "club-123" });

  describe("Club Owner permissions for section updates", () => {
    it("should allow club owner to update header section", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-owner", isRoot: false },
      });

      // Club owner membership
      (prisma.clubMembership.findMany as jest.Mock).mockResolvedValue([
        { clubId: "club-123", role: "CLUB_OWNER" },
      ]);

      (prisma.club.findUnique as jest.Mock).mockResolvedValue(mockClub);
      (prisma.club.update as jest.Mock).mockResolvedValue({
        ...mockClub,
        name: "Updated Name",
      });

      const request = new Request(
        "http://localhost:3000/api/admin/clubs/club-123/section",
        {
          method: "PATCH",
          body: JSON.stringify({
            section: "header",
            payload: {
              name: "Updated Name",
              slug: "test-club",
              shortDescription: "Updated description",
              isPublic: true,
            },
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PATCH(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe("Updated Name");
    });

    it("should allow club owner to update hours section", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-owner", isRoot: false },
      });

      (prisma.clubMembership.findMany as jest.Mock).mockResolvedValue([
        { clubId: "club-123", role: "CLUB_OWNER" },
      ]);

      (prisma.club.findUnique as jest.Mock).mockResolvedValue(mockClub);

      // Mock transaction
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback({
          clubBusinessHours: {
            deleteMany: jest.fn(),
            createMany: jest.fn(),
          },
          clubSpecialHours: {
            deleteMany: jest.fn(),
            createMany: jest.fn(),
          },
          club: {
            findUnique: jest.fn().mockResolvedValue(mockClub),
          },
        });
      });

      const request = new Request(
        "http://localhost:3000/api/admin/clubs/club-123/section",
        {
          method: "PATCH",
          body: JSON.stringify({
            section: "hours",
            payload: {
              businessHours: [
                { dayOfWeek: 1, openTime: "09:00", closeTime: "18:00", isClosed: false },
              ],
              specialHours: [],
            },
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PATCH(request, { params: mockParams });

      expect(response.status).toBe(200);
    });

    it("should deny club owner updating a different club", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-owner", isRoot: false },
      });

      // Club owner for a different club
      (prisma.clubMembership.findMany as jest.Mock).mockResolvedValue([
        { clubId: "club-other", role: "CLUB_OWNER" },
      ]);

      const request = new Request(
        "http://localhost:3000/api/admin/clubs/club-123/section",
        {
          method: "PATCH",
          body: JSON.stringify({
            section: "header",
            payload: {
              name: "Updated Name",
              slug: "test-club",
              shortDescription: "desc",
              isPublic: true,
            },
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PATCH(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });
  });

  describe("Club Admin permissions for section updates", () => {
    it("should allow club admin to update contacts section", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-admin", isRoot: false },
      });

      (prisma.clubMembership.findMany as jest.Mock).mockResolvedValue([
        { clubId: "club-123", role: "CLUB_ADMIN" },
      ]);

      (prisma.club.findUnique as jest.Mock).mockResolvedValue(mockClub);
      (prisma.club.update as jest.Mock).mockResolvedValue({
        ...mockClub,
        phone: "123-456-7890",
      });

      const request = new Request(
        "http://localhost:3000/api/admin/clubs/club-123/section",
        {
          method: "PATCH",
          body: JSON.stringify({
            section: "contacts",
            payload: {
              location: "123 Test Street",
              phone: "123-456-7890",
              email: "test@club.com",
            },
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PATCH(request, { params: mockParams });

      expect(response.status).toBe(200);
    });

    it("should allow club admin to update gallery section", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-admin", isRoot: false },
      });

      (prisma.clubMembership.findMany as jest.Mock).mockResolvedValue([
        { clubId: "club-123", role: "CLUB_ADMIN" },
      ]);

      (prisma.club.findUnique as jest.Mock).mockResolvedValue(mockClub);

      // Mock transaction
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback({
          club: {
            update: jest.fn(),
            findUnique: jest.fn().mockResolvedValue(mockClub),
          },
          clubGallery: {
            deleteMany: jest.fn(),
            createMany: jest.fn(),
          },
        });
      });

      const request = new Request(
        "http://localhost:3000/api/admin/clubs/club-123/section",
        {
          method: "PATCH",
          body: JSON.stringify({
            section: "gallery",
            payload: {
              bannerData: { url: "https://example.com/banner.jpg" },
              logoData: { url: "https://example.com/logo.jpg" },
              gallery: [],
            },
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PATCH(request, { params: mockParams });

      expect(response.status).toBe(200);
    });

    it("should deny club admin updating a different club", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-admin", isRoot: false },
      });

      // Club admin for a different club
      (prisma.clubMembership.findMany as jest.Mock).mockResolvedValue([
        { clubId: "club-other", role: "CLUB_ADMIN" },
      ]);

      const request = new Request(
        "http://localhost:3000/api/admin/clubs/club-123/section",
        {
          method: "PATCH",
          body: JSON.stringify({
            section: "header",
            payload: {
              name: "Updated Name",
              slug: "test-club",
              shortDescription: "desc",
              isPublic: true,
            },
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PATCH(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });
  });

  describe("Organization Admin permissions for section updates", () => {
    it("should allow organization admin to update clubs in their org", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-org-admin", isRoot: false },
      });

      (prisma.membership.findMany as jest.Mock).mockResolvedValue([
        { organizationId: "org-123", role: "ORGANIZATION_ADMIN" },
      ]);

      (prisma.club.findUnique as jest.Mock).mockResolvedValue(mockClub);
      (prisma.club.update as jest.Mock).mockResolvedValue({
        ...mockClub,
        name: "Updated by Org Admin",
      });

      const request = new Request(
        "http://localhost:3000/api/admin/clubs/club-123/section",
        {
          method: "PATCH",
          body: JSON.stringify({
            section: "header",
            payload: {
              name: "Updated by Org Admin",
              slug: "test-club",
              shortDescription: "desc",
              isPublic: true,
            },
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PATCH(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe("Updated by Org Admin");
    });

    it("should deny organization admin updating clubs in other orgs", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-org-admin", isRoot: false },
      });

      // Org admin for a different organization
      (prisma.membership.findMany as jest.Mock).mockResolvedValue([
        { organizationId: "org-other", role: "ORGANIZATION_ADMIN" },
      ]);

      (prisma.club.findUnique as jest.Mock).mockResolvedValue(mockClub);

      const request = new Request(
        "http://localhost:3000/api/admin/clubs/club-123/section",
        {
          method: "PATCH",
          body: JSON.stringify({
            section: "header",
            payload: {
              name: "Updated Name",
              slug: "test-club",
              shortDescription: "desc",
              isPublic: true,
            },
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PATCH(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });
  });

  describe("Root Admin permissions for section updates", () => {
    it("should allow root admin to update any club section", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-root", isRoot: true },
      });

      (prisma.club.findUnique as jest.Mock).mockResolvedValue(mockClub);
      (prisma.club.update as jest.Mock).mockResolvedValue({
        ...mockClub,
        name: "Updated by Root",
      });

      const request = new Request(
        "http://localhost:3000/api/admin/clubs/club-123/section",
        {
          method: "PATCH",
          body: JSON.stringify({
            section: "header",
            payload: {
              name: "Updated by Root",
              slug: "test-club",
              shortDescription: "desc",
              isPublic: true,
            },
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PATCH(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe("Updated by Root");
    });
  });
});
