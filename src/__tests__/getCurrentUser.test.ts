/**
 * @jest-environment node
 */

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

import { getCurrentUser } from "@/lib/getCurrentUser";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockPrismaUserFindUnique = prisma.user.findUnique as jest.MockedFunction<typeof prisma.user.findUnique>;
const mockPrismaUserCreate = prisma.user.create as jest.MockedFunction<typeof prisma.user.create>;

describe("getCurrentUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 if user is not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await getCurrentUser();

    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      expect(result.response.status).toBe(401);
      const data = await result.response.json();
      expect(data.error).toBe("Unauthorized");
    }
  });

  it("should return existing user from database", async () => {
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      emailVerified: null,
      image: null,
      password: null,
      isRoot: false,
      blocked: false,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAuth.mockResolvedValue({
      user: {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        isRoot: false,
      },
    });

    mockPrismaUserFindUnique.mockResolvedValue(mockUser);

    const result = await getCurrentUser();

    expect(result.authorized).toBe(true);
    if (result.authorized) {
      expect(result.user).toEqual(mockUser);
    }

    expect(mockPrismaUserFindUnique).toHaveBeenCalledWith({
      where: { id: "user-123" },
    });
    expect(mockPrismaUserCreate).not.toHaveBeenCalled();
  });

  it("should create user if not found in database", async () => {
    const mockCreatedUser = {
      id: "user-456",
      email: "newuser@example.com",
      name: "New User",
      emailVerified: null,
      image: null,
      password: null,
      isRoot: false,
      blocked: false,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAuth.mockResolvedValue({
      user: {
        id: "user-456",
        email: "newuser@example.com",
        name: "New User",
        isRoot: false,
      },
    });

    // First call returns null (user not found), second call returns null (no email conflict)
    mockPrismaUserFindUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    mockPrismaUserCreate.mockResolvedValue(mockCreatedUser);

    const result = await getCurrentUser();

    expect(result.authorized).toBe(true);
    if (result.authorized) {
      expect(result.user).toEqual(mockCreatedUser);
    }

    expect(mockPrismaUserFindUnique).toHaveBeenCalledWith({
      where: { id: "user-456" },
    });
    expect(mockPrismaUserFindUnique).toHaveBeenCalledWith({
      where: { email: "newuser@example.com" },
    });
    expect(mockPrismaUserCreate).toHaveBeenCalledWith({
      data: {
        id: "user-456",
        email: "newuser@example.com",
        name: "New User",
        image: null,
        isRoot: false,
      },
    });
  });

  it("should use existing user if email matches but ID differs", async () => {
    const mockExistingUser = {
      id: "user-789",
      email: "existing@example.com",
      name: "Existing User",
      emailVerified: null,
      image: null,
      password: null,
      isRoot: false,
      blocked: false,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAuth.mockResolvedValue({
      user: {
        id: "user-999", // Different ID
        email: "existing@example.com",
        name: "Session User",
        isRoot: false,
      },
    });

    // First call returns null (user with session ID not found)
    // Second call returns existing user with same email
    mockPrismaUserFindUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(mockExistingUser);

    const result = await getCurrentUser();

    expect(result.authorized).toBe(true);
    if (result.authorized) {
      expect(result.user).toEqual(mockExistingUser);
      expect(result.user.id).toBe("user-789"); // Should use existing user's ID
    }

    expect(mockPrismaUserCreate).not.toHaveBeenCalled();
  });

  it("should return 400 if email is missing when creating user", async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: "user-no-email",
        email: null, // No email
        name: "No Email User",
        isRoot: false,
      },
    });

    mockPrismaUserFindUnique.mockResolvedValue(null);

    const result = await getCurrentUser();

    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      expect(result.response.status).toBe(400);
      const data = await result.response.json();
      expect(data.error).toContain("email");
    }

    expect(mockPrismaUserCreate).not.toHaveBeenCalled();
  });

  it("should preserve isRoot flag when creating user", async () => {
    const mockRootUser = {
      id: "root-123",
      email: "root@example.com",
      name: "Root Admin",
      emailVerified: null,
      image: null,
      password: null,
      isRoot: true,
      blocked: false,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAuth.mockResolvedValue({
      user: {
        id: "root-123",
        email: "root@example.com",
        name: "Root Admin",
        isRoot: true,
      },
    });

    mockPrismaUserFindUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    mockPrismaUserCreate.mockResolvedValue(mockRootUser);

    const result = await getCurrentUser();

    expect(result.authorized).toBe(true);
    if (result.authorized) {
      expect(result.user.isRoot).toBe(true);
    }

    expect(mockPrismaUserCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        isRoot: true,
      }),
    });
  });

  it("should handle user with image", async () => {
    const mockUserWithImage = {
      id: "user-img",
      email: "user@example.com",
      name: "User With Image",
      emailVerified: null,
      image: "https://example.com/image.jpg",
      password: null,
      isRoot: false,
      blocked: false,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAuth.mockResolvedValue({
      user: {
        id: "user-img",
        email: "user@example.com",
        name: "User With Image",
        image: "https://example.com/image.jpg",
        isRoot: false,
      },
    });

    mockPrismaUserFindUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    mockPrismaUserCreate.mockResolvedValue(mockUserWithImage);

    const result = await getCurrentUser();

    expect(result.authorized).toBe(true);
    if (result.authorized) {
      expect(result.user.image).toBe("https://example.com/image.jpg");
    }

    expect(mockPrismaUserCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        image: "https://example.com/image.jpg",
      }),
    });
  });
});
