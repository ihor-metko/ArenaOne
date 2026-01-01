/**
 * @jest-environment node
 */

// Mock Prisma with membership tables for role-based access control
jest.mock("@/lib/prisma", () => ({
  prisma: {
    club: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    membership: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    clubMembership: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

// Mock auth function
const mockAuth = jest.fn();
jest.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

import { PUT } from "@/app/api/admin/clubs/[id]/route";
import { prisma } from "@/lib/prisma";

describe("Club Update Permissions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: non-admin user has no memberships
    (prisma.membership.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.clubMembership.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.clubMembership.findUnique as jest.Mock).mockResolvedValue(null);
  });

  const mockClub = {
    id: "club-123",
    name: "Test Club",
    location: "123 Test St",
    organizationId: "org-123",
    logoData: null,
    bannerData: null,
  };

  const mockUpdatedClub = {
    ...mockClub,
    name: "Updated Club",
    location: "456 New St",
  };

  describe("Club Owner permissions", () => {
    it("should allow club owner to update their own club", async () => {
      // Setup: user is a club owner for this club
      mockAuth.mockResolvedValue({
        user: { id: "user-owner", isRoot: false },
      });

      // Club owner membership - use findUnique for new guards
      (prisma.clubMembership.findUnique as jest.Mock).mockResolvedValue({
        role: "CLUB_OWNER",
      });
      (prisma.club.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockClub) // First call in canManageClub
        .mockResolvedValueOnce(mockClub) // Second call in PUT handler
        .mockResolvedValueOnce(mockUpdatedClub); // Third call for update result

      (prisma.club.update as jest.Mock).mockResolvedValue(mockUpdatedClub);

      const request = new Request(
        "http://localhost:3000/api/admin/clubs/club-123",
        {
          method: "PUT",
          body: JSON.stringify({
            name: "Updated Club",
            location: "456 New St",
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: "club-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe("Updated Club");
      expect(prisma.club.update).toHaveBeenCalledWith({
        where: { id: "club-123" },
        data: expect.objectContaining({
          name: "Updated Club",
          location: "456 New St",
        }),
      });
    });

    it("should deny club owner updating a different club", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-owner", isRoot: false },
      });

      // Club owner for a different club - they don't have access to club-123
      (prisma.club.findUnique as jest.Mock).mockResolvedValue(mockClub);
      (prisma.clubMembership.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new Request(
        "http://localhost:3000/api/admin/clubs/club-123",
        {
          method: "PUT",
          body: JSON.stringify({
            name: "Updated Club",
            location: "456 New St",
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: "club-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
      expect(prisma.club.update).not.toHaveBeenCalled();
    });
  });

  describe("Club Admin permissions", () => {
    it("should allow club admin to update their own club", async () => {
      // Setup: user is a club admin for this club
      mockAuth.mockResolvedValue({
        user: { id: "user-admin", isRoot: false },
      });

      // Club admin membership
      (prisma.clubMembership.findUnique as jest.Mock).mockResolvedValue({
        role: "CLUB_ADMIN",
      });
      (prisma.club.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockClub) // First call in canManageClub
        .mockResolvedValueOnce(mockClub) // Second call in PUT handler
        .mockResolvedValueOnce(mockUpdatedClub); // Third call for update result

      (prisma.club.update as jest.Mock).mockResolvedValue(mockUpdatedClub);

      const request = new Request(
        "http://localhost:3000/api/admin/clubs/club-123",
        {
          method: "PUT",
          body: JSON.stringify({
            name: "Updated Club",
            location: "456 New St",
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: "club-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe("Updated Club");
      expect(prisma.club.update).toHaveBeenCalledWith({
        where: { id: "club-123" },
        data: expect.objectContaining({
          name: "Updated Club",
          location: "456 New St",
        }),
      });
    });

    it("should deny club admin updating a different club", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-admin", isRoot: false },
      });

      // Club admin for a different club - they don't have access to club-123
      (prisma.club.findUnique as jest.Mock).mockResolvedValue(mockClub);
      (prisma.clubMembership.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new Request(
        "http://localhost:3000/api/admin/clubs/club-123",
        {
          method: "PUT",
          body: JSON.stringify({
            name: "Updated Club",
            location: "456 New St",
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: "club-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
      expect(prisma.club.update).not.toHaveBeenCalled();
    });
  });

  describe("Organization Admin permissions", () => {
    it("should allow organization admin to update clubs in their organization", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-org-admin", isRoot: false },
      });

      // Organization admin
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        role: "ORGANIZATION_ADMIN",
        isPrimaryOwner: false,
      });
      (prisma.club.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockClub) // First call in canManageClub
        .mockResolvedValueOnce(mockClub) // Second call in PUT handler
        .mockResolvedValueOnce(mockUpdatedClub); // Third call for update result

      (prisma.club.update as jest.Mock).mockResolvedValue(mockUpdatedClub);

      const request = new Request(
        "http://localhost:3000/api/admin/clubs/club-123",
        {
          method: "PUT",
          body: JSON.stringify({
            name: "Updated Club",
            location: "456 New St",
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: "club-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe("Updated Club");
    });

    it("should deny organization admin updating clubs in other organizations", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-org-admin", isRoot: false },
      });

      // Organization admin for a different org - they don't have access to org-123
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.club.findUnique as jest.Mock).mockResolvedValue(mockClub);

      const request = new Request(
        "http://localhost:3000/api/admin/clubs/club-123",
        {
          method: "PUT",
          body: JSON.stringify({
            name: "Updated Club",
            location: "456 New St",
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: "club-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
      expect(prisma.club.update).not.toHaveBeenCalled();
    });
  });

  describe("Root Admin permissions", () => {
    it("should allow root admin to update any club", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-root", isRoot: true },
      });

      (prisma.club.findUnique as jest.Mock).mockResolvedValue(mockClub);
      (prisma.club.update as jest.Mock).mockResolvedValue(mockUpdatedClub);

      const request = new Request(
        "http://localhost:3000/api/admin/clubs/club-123",
        {
          method: "PUT",
          body: JSON.stringify({
            name: "Updated Club",
            location: "456 New St",
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: "club-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe("Updated Club");
    });
  });

  describe("Mixed role scenarios", () => {
    it("should allow user with both organization admin and club owner roles", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-mixed", isRoot: false },
      });

      // User is org admin (has access via org admin role)
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        role: "ORGANIZATION_ADMIN",
        isPrimaryOwner: false,
      });
      (prisma.club.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockClub) // First call in canManageClub
        .mockResolvedValueOnce(mockClub) // Second call in PUT handler
        .mockResolvedValueOnce(mockUpdatedClub); // Third call for update result

      (prisma.club.update as jest.Mock).mockResolvedValue(mockUpdatedClub);

      const request = new Request(
        "http://localhost:3000/api/admin/clubs/club-123",
        {
          method: "PUT",
          body: JSON.stringify({
            name: "Updated Club",
            location: "456 New St",
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: "club-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe("Updated Club");
    });
  });
});
