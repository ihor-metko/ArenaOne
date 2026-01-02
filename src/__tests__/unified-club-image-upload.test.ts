/**
 * @jest-environment node
 */

/**
 * Tests for unified club image upload endpoint.
 * 
 * This tests the unified /api/images/clubs/[id]/upload endpoint
 * which handles logo, heroImage, secondLogo, and gallery uploads.
 */

import { POST } from "@/app/api/images/clubs/[id]/upload/route";
import { NextRequest } from "next/server";
import { validateUploadedFile, saveUploadedFile, getUploadedImageUrl } from "@/lib/fileUpload";
import { requireClubAdmin } from "@/lib/requireRole";
import { ClubMembershipRole } from "@/constants/roles";

// Mock dependencies
jest.mock("@/lib/fileUpload", () => ({
  validateUploadedFile: jest.fn(),
  saveUploadedFile: jest.fn(),
  getUploadedImageUrl: jest.fn(),
}));

jest.mock("@/lib/requireRole", () => ({
  requireClubAdmin: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    club: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockValidateUploadedFile = validateUploadedFile as jest.MockedFunction<typeof validateUploadedFile>;
const mockSaveUploadedFile = saveUploadedFile as jest.MockedFunction<typeof saveUploadedFile>;
const mockGetUploadedImageUrl = getUploadedImageUrl as jest.MockedFunction<typeof getUploadedImageUrl>;
const mockRequireClubAdmin = requireClubAdmin as jest.MockedFunction<typeof requireClubAdmin>;

import { prisma } from "@/lib/prisma";

describe("POST /api/images/clubs/[id]/upload - Unified Upload Endpoint", () => {
  const mockClubId = "club-123";
  const mockFilename = "1234567890-abc123.webp";
  const mockUrl = "https://example.com/uploads/clubs/club-123/1234567890-abc123.webp";

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks for successful upload
    mockRequireClubAdmin.mockResolvedValue({
      authorized: true,
      response: undefined as any,
    });

    (prisma.club.findUnique as jest.Mock).mockResolvedValue({
      id: mockClubId,
      name: "Test Club",
    });

    mockValidateUploadedFile.mockReturnValue(null);
    mockSaveUploadedFile.mockResolvedValue(mockFilename);
    mockGetUploadedImageUrl.mockReturnValue(mockUrl);
  });

  const createFormData = (file: File, type: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    return formData;
  };

  const createMockFile = (name = "test.jpg", size = 1000) => {
    return new File(["fake content"], name, { type: "image/jpeg" });
  };

  const createRequest = (formData: FormData) => {
    return new NextRequest("http://localhost:3000/api/images/clubs/club-123/upload", {
      method: "POST",
      body: formData as any,
    });
  };

  describe("Image type validation", () => {
    it("should accept logo type", async () => {
      const file = createMockFile();
      const formData = createFormData(file, "logo");
      const request = createRequest(formData);

      (prisma.club.update as jest.Mock).mockResolvedValue({});

      const response = await POST(request, { params: Promise.resolve({ id: mockClubId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.url).toBe(mockUrl);
      expect(data.type).toBe("logo");
    });

    it("should accept heroImage type", async () => {
      const file = createMockFile();
      const formData = createFormData(file, "heroImage");
      const request = createRequest(formData);

      (prisma.club.update as jest.Mock).mockResolvedValue({});

      const response = await POST(request, { params: Promise.resolve({ id: mockClubId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.type).toBe("heroImage");
    });

    it("should accept secondLogo type", async () => {
      const file = createMockFile();
      const formData = createFormData(file, "secondLogo");
      const request = createRequest(formData);

      (prisma.club.findUnique as jest.Mock).mockResolvedValue({
        id: mockClubId,
        metadata: null,
      });
      (prisma.club.update as jest.Mock).mockResolvedValue({});

      const response = await POST(request, { params: Promise.resolve({ id: mockClubId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.type).toBe("secondLogo");
    });

    it("should accept gallery type", async () => {
      const file = createMockFile();
      const formData = createFormData(file, "gallery");
      const request = createRequest(formData);

      const response = await POST(request, { params: Promise.resolve({ id: mockClubId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.type).toBe("gallery");
      
      // Gallery type should NOT update database
      expect(prisma.club.update).not.toHaveBeenCalled();
    });

    it("should reject invalid type", async () => {
      const file = createMockFile();
      const formData = createFormData(file, "invalid");
      const request = createRequest(formData);

      const response = await POST(request, { params: Promise.resolve({ id: mockClubId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Invalid image type");
    });

    it("should reject missing type", async () => {
      const file = createMockFile();
      const formData = new FormData();
      formData.append("file", file);
      // No type parameter
      const request = createRequest(formData);

      const response = await POST(request, { params: Promise.resolve({ id: mockClubId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Invalid image type");
    });
  });

  describe("File validation", () => {
    it("should reject when no file provided", async () => {
      const formData = new FormData();
      formData.append("type", "logo");
      const request = createRequest(formData);

      const response = await POST(request, { params: Promise.resolve({ id: mockClubId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("No file provided");
    });

    it("should reject when file validation fails", async () => {
      mockValidateUploadedFile.mockReturnValue("File too large");

      const file = createMockFile();
      const formData = createFormData(file, "logo");
      const request = createRequest(formData);

      const response = await POST(request, { params: Promise.resolve({ id: mockClubId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("File too large");
    });

    it("should return 415 for invalid file type", async () => {
      mockValidateUploadedFile.mockReturnValue("Invalid file type. Allowed types: JPEG, PNG, GIF, WebP, SVG");

      const file = createMockFile();
      const formData = createFormData(file, "logo");
      const request = createRequest(formData);

      const response = await POST(request, { params: Promise.resolve({ id: mockClubId }) });
      const data = await response.json();

      expect(response.status).toBe(415);
      expect(data.error).toContain("Invalid file type");
    });
  });

  describe("Authorization", () => {
    it("should reject unauthorized users", async () => {
      mockRequireClubAdmin.mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
      });

      const file = createMockFile();
      const formData = createFormData(file, "logo");
      const request = createRequest(formData);

      const response = await POST(request, { params: Promise.resolve({ id: mockClubId }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should accept club admins", async () => {
      mockRequireClubAdmin.mockResolvedValue({
        authorized: true,
        response: undefined as any,
      });

      (prisma.club.update as jest.Mock).mockResolvedValue({});

      const file = createMockFile();
      const formData = createFormData(file, "logo");
      const request = createRequest(formData);

      const response = await POST(request, { params: Promise.resolve({ id: mockClubId }) });

      expect(response.status).toBe(200);
      expect(mockRequireClubAdmin).toHaveBeenCalledWith(
        mockClubId,
        [ClubMembershipRole.CLUB_ADMIN, ClubMembershipRole.CLUB_OWNER]
      );
    });
  });

  describe("Club validation", () => {
    it("should return 404 when club not found", async () => {
      (prisma.club.findUnique as jest.Mock).mockResolvedValue(null);

      const file = createMockFile();
      const formData = createFormData(file, "logo");
      const request = createRequest(formData);

      const response = await POST(request, { params: Promise.resolve({ id: mockClubId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Club not found");
    });
  });

  describe("Database updates", () => {
    it("should update logoData for logo type", async () => {
      const file = createMockFile();
      const formData = createFormData(file, "logo");
      const request = createRequest(formData);

      (prisma.club.findUnique as jest.Mock).mockResolvedValueOnce({
        id: mockClubId,
      }).mockResolvedValueOnce({
        id: mockClubId,
        logoData: null,
        bannerData: null,
      });

      (prisma.club.update as jest.Mock).mockResolvedValue({});

      await POST(request, { params: Promise.resolve({ id: mockClubId }) });

      expect(prisma.club.update).toHaveBeenCalledWith({
        where: { id: mockClubId },
        data: {
          logoData: expect.stringContaining(mockUrl),
        },
      });
    });

    it("should update bannerData for heroImage type", async () => {
      const file = createMockFile();
      const formData = createFormData(file, "heroImage");
      const request = createRequest(formData);

      (prisma.club.findUnique as jest.Mock).mockResolvedValueOnce({
        id: mockClubId,
      }).mockResolvedValueOnce({
        id: mockClubId,
        logoData: null,
        bannerData: null,
      });

      (prisma.club.update as jest.Mock).mockResolvedValue({});

      await POST(request, { params: Promise.resolve({ id: mockClubId }) });

      expect(prisma.club.update).toHaveBeenCalledWith({
        where: { id: mockClubId },
        data: {
          bannerData: expect.stringContaining(mockUrl),
        },
      });
    });

    it("should update metadata for secondLogo type", async () => {
      const file = createMockFile();
      const formData = createFormData(file, "secondLogo");
      const request = createRequest(formData);

      (prisma.club.findUnique as jest.Mock).mockResolvedValueOnce({
        id: mockClubId,
      }).mockResolvedValueOnce({
        id: mockClubId,
        metadata: JSON.stringify({ existingKey: "value" }),
      });

      (prisma.club.update as jest.Mock).mockResolvedValue({});

      await POST(request, { params: Promise.resolve({ id: mockClubId }) });

      expect(prisma.club.update).toHaveBeenCalledWith({
        where: { id: mockClubId },
        data: {
          metadata: expect.stringContaining(mockUrl),
        },
      });

      // Verify metadata was properly merged
      const updateCall = (prisma.club.update as jest.Mock).mock.calls[0][0];
      const metadata = JSON.parse(updateCall.data.metadata);
      expect(metadata.secondLogo).toBe(mockUrl);
      expect(metadata.existingKey).toBe("value");
    });

    it("should NOT update database for gallery type", async () => {
      const file = createMockFile();
      const formData = createFormData(file, "gallery");
      const request = createRequest(formData);

      await POST(request, { params: Promise.resolve({ id: mockClubId }) });

      // For gallery, only the first findUnique should be called (to verify club exists)
      expect(prisma.club.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.club.update).not.toHaveBeenCalled();
    });
  });

  describe("Response format", () => {
    it("should return correct response format", async () => {
      const file = createMockFile();
      const formData = createFormData(file, "logo");
      const request = createRequest(formData);

      (prisma.club.update as jest.Mock).mockResolvedValue({});

      const response = await POST(request, { params: Promise.resolve({ id: mockClubId }) });
      const data = await response.json();

      expect(data).toEqual({
        success: true,
        url: mockUrl,
        filename: mockFilename,
        type: "logo",
      });
    });
  });
});
