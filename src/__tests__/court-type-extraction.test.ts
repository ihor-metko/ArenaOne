/**
 * @jest-environment node
 */
import { POST } from "@/app/api/admin/clubs/[id]/courts/route";
import { PATCH } from "@/app/api/admin/courts/[courtId]/route";
import { prisma } from "@/lib/prisma";
import { requireClubManagement, requireAnyAdmin } from "@/lib/requireRole";

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    club: {
      findUnique: jest.fn(),
    },
    court: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

// Mock auth
jest.mock("@/lib/requireRole", () => ({
  requireClubManagement: jest.fn(),
  requireAnyAdmin: jest.fn(),
}));

describe("Court Type Extraction from Metadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful auth
    (requireClubManagement as jest.Mock).mockResolvedValue({
      authorized: true,
      adminType: "root_admin",
      managedIds: [],
    });
    
    (requireAnyAdmin as jest.Mock).mockResolvedValue({
      authorized: true,
      adminType: "root_admin",
      managedIds: [],
    });
  });

  describe("POST /api/admin/clubs/[id]/courts - Court Creation", () => {
    it("should extract 'single' from metadata and set type to 'Single'", async () => {
      const mockClub = { id: "club-123" };
      (prisma.club.findUnique as jest.Mock).mockResolvedValue(mockClub);
      
      const mockCourt = {
        id: "court-123",
        clubId: "club-123",
        name: "Court 1",
        type: "Single", // This should be set from metadata
        metadata: JSON.stringify({ padelCourtFormat: "single" }),
      };
      (prisma.court.create as jest.Mock).mockResolvedValue(mockCourt);

      const request = new Request("http://localhost:3000/api/admin/clubs/club-123/courts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Court 1",
          type: "padel",
          metadata: JSON.stringify({ padelCourtFormat: "single" }),
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: "club-123" }),
      });

      expect(response.status).toBe(201);
      
      // Verify the create call was made with the correct type
      expect(prisma.court.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: "Single", // Should be capitalized
          }),
        })
      );
    });

    it("should extract 'double' from metadata and set type to 'Double'", async () => {
      const mockClub = { id: "club-123" };
      (prisma.club.findUnique as jest.Mock).mockResolvedValue(mockClub);
      
      const mockCourt = {
        id: "court-123",
        clubId: "club-123",
        name: "Court 1",
        type: "Double",
        metadata: JSON.stringify({ padelCourtFormat: "double" }),
      };
      (prisma.court.create as jest.Mock).mockResolvedValue(mockCourt);

      const request = new Request("http://localhost:3000/api/admin/clubs/club-123/courts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Court 1",
          type: "padel",
          metadata: JSON.stringify({ padelCourtFormat: "double" }),
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: "club-123" }),
      });

      expect(response.status).toBe(201);
      
      // Verify the create call was made with the correct type
      expect(prisma.court.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: "Double", // Should be capitalized
          }),
        })
      );
    });

    it("should require padelCourtFormat when type is 'padel'", async () => {
      const mockClub = { id: "club-123" };
      (prisma.club.findUnique as jest.Mock).mockResolvedValue(mockClub);

      const request = new Request("http://localhost:3000/api/admin/clubs/club-123/courts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Court 1",
          type: "padel",
          metadata: JSON.stringify({}), // No padelCourtFormat
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: "club-123" }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Single or Double");
    });
  });

  describe("PATCH /api/admin/courts/[courtId] - Court Update", () => {
    it("should extract 'single' from metadata and update type to 'Single'", async () => {
      const mockCourt = {
        id: "court-123",
        clubId: "club-123",
        name: "Court 1",
        type: "padel",
        metadata: null,
        club: {
          id: "club-123",
          organizationId: "org-123",
        },
      };
      (prisma.court.findUnique as jest.Mock).mockResolvedValue(mockCourt);
      
      const mockUpdatedCourt = {
        ...mockCourt,
        type: "Single",
        metadata: JSON.stringify({ padelCourtFormat: "single" }),
      };
      (prisma.court.update as jest.Mock).mockResolvedValue(mockUpdatedCourt);

      const request = new Request("http://localhost:3000/api/admin/courts/court-123", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: JSON.stringify({ padelCourtFormat: "single" }),
        }),
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ courtId: "court-123" }),
      });

      expect(response.status).toBe(200);
      
      // Verify the update call was made with the correct type
      expect(prisma.court.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: "Single", // Should be capitalized
            metadata: JSON.stringify({ padelCourtFormat: "single" }),
          }),
        })
      );
    });

    it("should extract 'double' from metadata and update type to 'Double'", async () => {
      const mockCourt = {
        id: "court-123",
        clubId: "club-123",
        name: "Court 1",
        type: "padel",
        metadata: null,
        club: {
          id: "club-123",
          organizationId: "org-123",
        },
      };
      (prisma.court.findUnique as jest.Mock).mockResolvedValue(mockCourt);
      
      const mockUpdatedCourt = {
        ...mockCourt,
        type: "Double",
        metadata: JSON.stringify({ padelCourtFormat: "double" }),
      };
      (prisma.court.update as jest.Mock).mockResolvedValue(mockUpdatedCourt);

      const request = new Request("http://localhost:3000/api/admin/courts/court-123", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: JSON.stringify({ padelCourtFormat: "double" }),
        }),
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ courtId: "court-123" }),
      });

      expect(response.status).toBe(200);
      
      // Verify the update call was made with the correct type
      expect(prisma.court.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: "Double", // Should be capitalized
            metadata: JSON.stringify({ padelCourtFormat: "double" }),
          }),
        })
      );
    });
  });
});
