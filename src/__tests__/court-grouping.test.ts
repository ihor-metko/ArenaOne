import { generateGroupName, findOrCreateCourtGroup, assignCourtToGroup } from "@/lib/courtGrouping";
import { prisma } from "@/lib/prisma";

// Mock prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    courtGroup: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    court: {
      update: jest.fn(),
    },
  },
}));

describe("Court Grouping Logic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateGroupName", () => {
    it("should generate name with all attributes", () => {
      const name = generateGroupName("Hard", "Blue", "Single", "PADEL");
      expect(name).toBe("Hard Blue Single PADEL");
    });

    it("should generate name with partial attributes", () => {
      const name = generateGroupName("Clay", null, null, "TENNIS");
      expect(name).toBe("Clay TENNIS");
    });

    it("should generate name with only sport type", () => {
      const name = generateGroupName(null, null, null, "PADEL");
      expect(name).toBe("PADEL");
    });
  });

  describe("findOrCreateCourtGroup", () => {
    it("should return existing group if found", async () => {
      const existingGroup = {
        id: "group-123",
        clubId: "club-1",
        name: "Hard Blue Single PADEL",
        surface: "Hard",
        color: "Blue",
        gameType: "Single",
        sportType: "PADEL",
        defaultPriceCents: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.courtGroup.findUnique as jest.Mock).mockResolvedValue(existingGroup);

      const groupId = await findOrCreateCourtGroup("club-1", "Hard", "Blue", "Single", "PADEL");
      
      expect(groupId).toBe("group-123");
      expect(prisma.courtGroup.findUnique).toHaveBeenCalledWith({
        where: {
          clubId_surface_color_gameType_sportType: {
            clubId: "club-1",
            surface: "Hard",
            color: "Blue",
            gameType: "Single",
            sportType: "PADEL",
          },
        },
      });
    });

    it("should create new group if not found", async () => {
      const newGroup = {
        id: "group-456",
        clubId: "club-1",
        name: "Clay Red Double TENNIS",
        surface: "Clay",
        color: "Red",
        gameType: "Double",
        sportType: "TENNIS",
        defaultPriceCents: 1500,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.courtGroup.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.courtGroup.create as jest.Mock).mockResolvedValue(newGroup);

      const groupId = await findOrCreateCourtGroup("club-1", "Clay", "Red", "Double", "TENNIS", 1500);
      
      expect(groupId).toBe("group-456");
      expect(prisma.courtGroup.create).toHaveBeenCalledWith({
        data: {
          clubId: "club-1",
          name: "Clay Red Double TENNIS",
          surface: "Clay",
          color: "Red",
          gameType: "Double",
          sportType: "TENNIS",
          defaultPriceCents: 1500,
        },
      });
    });
  });

  describe("assignCourtToGroup", () => {
    it("should assign court to group when useGroupPricing is true", async () => {
      const existingGroup = {
        id: "group-789",
        clubId: "club-1",
        name: "Hard Blue Single PADEL",
        surface: "Hard",
        color: "Blue",
        gameType: "Single",
        sportType: "PADEL",
        defaultPriceCents: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.courtGroup.findUnique as jest.Mock).mockResolvedValue(existingGroup);
      (prisma.court.update as jest.Mock).mockResolvedValue({});

      await assignCourtToGroup("court-1", "club-1", "Hard", "Blue", "Single", "PADEL", true);

      expect(prisma.court.update).toHaveBeenCalledWith({
        where: { id: "court-1" },
        data: { groupId: "group-789", useGroupPricing: true },
      });
    });

    it("should remove court from group when useGroupPricing is false", async () => {
      (prisma.court.update as jest.Mock).mockResolvedValue({});

      await assignCourtToGroup("court-1", "club-1", "Hard", "Blue", "Single", "PADEL", false);

      expect(prisma.court.update).toHaveBeenCalledWith({
        where: { id: "court-1" },
        data: { groupId: null, useGroupPricing: false },
      });
      expect(prisma.courtGroup.findUnique).not.toHaveBeenCalled();
    });
  });
});
