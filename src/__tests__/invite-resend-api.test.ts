/**
 * @jest-environment node
 */

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    invite: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/services/emailService", () => ({
  sendInviteEmail: jest.fn(),
}));

jest.mock("@/lib/permissions", () => ({
  canInviteToOrganization: jest.fn(),
  canInviteToClub: jest.fn(),
}));

import { POST as resendInvite } from "@/app/api/invites/[id]/resend/route";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendInviteEmail } from "@/services/emailService";
import { canInviteToOrganization, canInviteToClub } from "@/lib/permissions";

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockPrismaInviteFindUnique = prisma.invite.findUnique as jest.MockedFunction<typeof prisma.invite.findUnique>;
const mockPrismaInviteUpdate = prisma.invite.update as jest.MockedFunction<typeof prisma.invite.update>;
const mockSendInviteEmail = sendInviteEmail as jest.MockedFunction<typeof sendInviteEmail>;
const mockCanInviteToOrganization = canInviteToOrganization as jest.MockedFunction<typeof canInviteToOrganization>;
const mockCanInviteToClub = canInviteToClub as jest.MockedFunction<typeof canInviteToClub>;

describe("POST /api/invites/[id]/resend - Resend Invite", () => {
  const validInvite = {
    id: "invite-123",
    email: "user@example.com",
    role: "ORGANIZATION_ADMIN" as const,
    organizationId: "org-123",
    clubId: null,
    status: "PENDING" as const,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    tokenHash: "hash123",
    invitedByUserId: "inviter-123",
    organization: { name: "Test Org" },
    club: null,
    invitedBy: { name: "John Doe" },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 if user is not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const request = new Request("http://localhost/api/invites/invite-123/resend", {
      method: "POST",
    });

    const response = await resendInvite(request, {
      params: Promise.resolve({ id: "invite-123" }),
    });

    expect(response.status).toBe(401);
  });

  it("should return 404 if invite does not exist", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-123", isRoot: false },
    });

    mockPrismaInviteFindUnique.mockResolvedValue(null);

    const request = new Request("http://localhost/api/invites/invite-123/resend", {
      method: "POST",
    });

    const response = await resendInvite(request, {
      params: Promise.resolve({ id: "invite-123" }),
    });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Invite not found");
  });

  it("should return 400 if invite is not PENDING", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-123", isRoot: false },
    });

    mockPrismaInviteFindUnique.mockResolvedValue({
      ...validInvite,
      status: "ACCEPTED",
    } as any);

    const request = new Request("http://localhost/api/invites/invite-123/resend", {
      method: "POST",
    });

    const response = await resendInvite(request, {
      params: Promise.resolve({ id: "invite-123" }),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Cannot resend invite with status");
  });

  it("should return 400 if invite has expired", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-123", isRoot: false },
    });

    mockPrismaInviteFindUnique.mockResolvedValue({
      ...validInvite,
      expiresAt: new Date(Date.now() - 1000), // Expired
    } as any);

    const request = new Request("http://localhost/api/invites/invite-123/resend", {
      method: "POST",
    });

    const response = await resendInvite(request, {
      params: Promise.resolve({ id: "invite-123" }),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("expired");
  });

  it("should allow original inviter to resend", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "inviter-123", isRoot: false },
    });

    mockPrismaInviteFindUnique.mockResolvedValue(validInvite as any);
    mockPrismaInviteUpdate.mockResolvedValue(validInvite as any);
    mockSendInviteEmail.mockResolvedValue({
      success: true,
      messageId: "msg-123",
    });

    const request = new Request("http://localhost/api/invites/invite-123/resend", {
      method: "POST",
    });

    const response = await resendInvite(request, {
      params: Promise.resolve({ id: "invite-123" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain("resent successfully");
    expect(mockSendInviteEmail).toHaveBeenCalled();
  });

  it("should allow root admin to resend", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "other-user", isRoot: true },
    });

    mockPrismaInviteFindUnique.mockResolvedValue(validInvite as any);
    mockPrismaInviteUpdate.mockResolvedValue(validInvite as any);
    mockSendInviteEmail.mockResolvedValue({
      success: true,
      messageId: "msg-456",
    });

    const request = new Request("http://localhost/api/invites/invite-123/resend", {
      method: "POST",
    });

    const response = await resendInvite(request, {
      params: Promise.resolve({ id: "invite-123" }),
    });

    expect(response.status).toBe(200);
    expect(mockSendInviteEmail).toHaveBeenCalled();
  });

  it("should allow organization admin to resend organization invite", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "org-admin", isRoot: false },
    });

    mockPrismaInviteFindUnique.mockResolvedValue(validInvite as any);
    mockPrismaInviteUpdate.mockResolvedValue(validInvite as any);
    mockCanInviteToOrganization.mockResolvedValue(true);
    mockSendInviteEmail.mockResolvedValue({
      success: true,
      messageId: "msg-789",
    });

    const request = new Request("http://localhost/api/invites/invite-123/resend", {
      method: "POST",
    });

    const response = await resendInvite(request, {
      params: Promise.resolve({ id: "invite-123" }),
    });

    expect(response.status).toBe(200);
    expect(mockCanInviteToOrganization).toHaveBeenCalledWith(
      { id: "org-admin", isRoot: false },
      "org-123",
      "ORGANIZATION_ADMIN"
    );
    expect(mockSendInviteEmail).toHaveBeenCalled();
  });

  it("should allow club admin to resend club invite", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "club-admin", isRoot: false },
    });

    const clubInvite = {
      ...validInvite,
      organizationId: null,
      clubId: "club-123",
      role: "CLUB_ADMIN" as const,
      organization: null,
      club: { name: "Test Club" },
    };

    mockPrismaInviteFindUnique.mockResolvedValue(clubInvite as any);
    mockPrismaInviteUpdate.mockResolvedValue(clubInvite as any);
    mockCanInviteToClub.mockResolvedValue(true);
    mockSendInviteEmail.mockResolvedValue({
      success: true,
      messageId: "msg-999",
    });

    const request = new Request("http://localhost/api/invites/invite-123/resend", {
      method: "POST",
    });

    const response = await resendInvite(request, {
      params: Promise.resolve({ id: "invite-123" }),
    });

    expect(response.status).toBe(200);
    expect(mockCanInviteToClub).toHaveBeenCalledWith(
      { id: "club-admin", isRoot: false },
      "club-123",
      "CLUB_ADMIN"
    );
    expect(mockSendInviteEmail).toHaveBeenCalled();
  });

  it("should return 403 if user has no permission to resend", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "unauthorized-user", isRoot: false },
    });

    mockPrismaInviteFindUnique.mockResolvedValue(validInvite as any);
    mockCanInviteToOrganization.mockResolvedValue(false);

    const request = new Request("http://localhost/api/invites/invite-123/resend", {
      method: "POST",
    });

    const response = await resendInvite(request, {
      params: Promise.resolve({ id: "invite-123" }),
    });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toContain("permission");
  });

  it("should return 500 if email sending fails", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "inviter-123", isRoot: false },
    });

    mockPrismaInviteFindUnique.mockResolvedValue(validInvite as any);
    mockPrismaInviteUpdate.mockResolvedValue(validInvite as any);
    mockSendInviteEmail.mockResolvedValue({
      success: false,
      error: "Email service unavailable",
    });

    const request = new Request("http://localhost/api/invites/invite-123/resend", {
      method: "POST",
    });

    const response = await resendInvite(request, {
      params: Promise.resolve({ id: "invite-123" }),
    });

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toContain("Failed to send invite email");
  });

  it("should update invite with new token", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "inviter-123", isRoot: false },
    });

    mockPrismaInviteFindUnique.mockResolvedValue(validInvite as any);
    mockPrismaInviteUpdate.mockResolvedValue(validInvite as any);
    mockSendInviteEmail.mockResolvedValue({
      success: true,
      messageId: "msg-abc",
    });

    const request = new Request("http://localhost/api/invites/invite-123/resend", {
      method: "POST",
    });

    await resendInvite(request, {
      params: Promise.resolve({ id: "invite-123" }),
    });

    expect(mockPrismaInviteUpdate).toHaveBeenCalledWith({
      where: { id: "invite-123" },
      data: { tokenHash: expect.any(String) },
    });
  });
});
