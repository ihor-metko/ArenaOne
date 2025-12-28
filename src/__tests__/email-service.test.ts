/**
 * @jest-environment node
 */

// Mock Resend
const mockResendSend = jest.fn();

jest.mock("resend", () => {
  const mockEmails = {
    send: (...args: any[]) => mockResendSend(...args),
  };
  
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: mockEmails,
    })),
  };
});

import { sendInviteEmail } from "@/services/emailService";

describe("Email Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("sendInviteEmail", () => {
    it("should send an invite email successfully", async () => {
      mockResendSend.mockResolvedValue({
        data: { id: "msg-123" },
        error: null,
      });

      const result = await sendInviteEmail({
        to: "user@example.com",
        inviteLink: "https://app.arenaone.com/invites/accept?token=abc123",
        role: "ORGANIZATION_ADMIN",
        organizationName: "Test Org",
        inviterName: "John Doe",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("msg-123");
      expect(mockResendSend).toHaveBeenCalledTimes(1);
      
      const callArgs = mockResendSend.mock.calls[0][0];
      expect(callArgs.to).toBe("user@example.com");
      expect(callArgs.subject).toBe("You've been invited to join Test Org");
      expect(callArgs.html).toContain("Organization Administrator");
      expect(callArgs.html).toContain("John Doe has invited you");
    });

    it("should send club invite email with correct content", async () => {
      mockResendSend.mockResolvedValue({
        data: { id: "msg-456" },
        error: null,
      });

      const result = await sendInviteEmail({
        to: "user@example.com",
        inviteLink: "https://app.arenaone.com/invites/accept?token=xyz789",
        role: "CLUB_ADMIN",
        clubName: "Test Club",
        inviterName: "Jane Smith",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("msg-456");
      expect(mockResendSend).toHaveBeenCalledTimes(1);
      
      const callArgs = mockResendSend.mock.calls[0][0];
      expect(callArgs.to).toBe("user@example.com");
      expect(callArgs.subject).toBe("You've been invited to join Test Club");
      expect(callArgs.html).toContain("Club Administrator");
      expect(callArgs.html).toContain("Jane Smith has invited you");
    });

    it("should handle email sending failure", async () => {
      mockResendSend.mockResolvedValue({
        data: null,
        error: { message: "API rate limit exceeded" },
      });

      const result = await sendInviteEmail({
        to: "user@example.com",
        inviteLink: "https://app.arenaone.com/invites/accept?token=abc123",
        role: "ORGANIZATION_OWNER",
        organizationName: "Test Org",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("API rate limit exceeded");
    });

    it("should handle exceptions gracefully", async () => {
      mockResendSend.mockRejectedValue(new Error("Network error"));

      const result = await sendInviteEmail({
        to: "user@example.com",
        inviteLink: "https://app.arenaone.com/invites/accept?token=abc123",
        role: "CLUB_OWNER",
        clubName: "Test Club",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });

    it("should include invite link in email HTML", async () => {
      mockResendSend.mockResolvedValue({
        data: { id: "msg-789" },
        error: null,
      });

      const inviteLink = "https://app.arenaone.com/invites/accept?token=test123";
      
      await sendInviteEmail({
        to: "user@example.com",
        inviteLink,
        role: "ORGANIZATION_ADMIN",
        organizationName: "Test Org",
      });

      const callArgs = mockResendSend.mock.calls[0][0];
      expect(callArgs.html).toContain(inviteLink);
      expect(callArgs.html).toContain("Accept Invitation");
    });

    it("should format role names correctly", async () => {
      mockResendSend.mockResolvedValue({
        data: { id: "msg-001" },
        error: null,
      });

      const testCases = [
        { role: "ORGANIZATION_OWNER", expected: "Organization Owner" },
        { role: "ORGANIZATION_ADMIN", expected: "Organization Administrator" },
        { role: "CLUB_OWNER", expected: "Club Owner" },
        { role: "CLUB_ADMIN", expected: "Club Administrator" },
      ];

      for (const testCase of testCases) {
        mockResendSend.mockClear();
        
        await sendInviteEmail({
          to: "user@example.com",
          inviteLink: "https://app.arenaone.com/invites/accept?token=abc",
          role: testCase.role,
          organizationName: "Test",
        });

        const callArgs = mockResendSend.mock.calls[0][0];
        expect(callArgs.html).toContain(testCase.expected);
      }
    });

    it("should include inviter name when provided", async () => {
      mockResendSend.mockResolvedValue({
        data: { id: "msg-002" },
        error: null,
      });

      await sendInviteEmail({
        to: "user@example.com",
        inviteLink: "https://app.arenaone.com/invites/accept?token=abc",
        role: "ORGANIZATION_ADMIN",
        organizationName: "Test Org",
        inviterName: "Alice Johnson",
      });

      const callArgs = mockResendSend.mock.calls[0][0];
      expect(callArgs.html).toContain("Alice Johnson has invited you");
    });

    it("should work without inviter name", async () => {
      mockResendSend.mockResolvedValue({
        data: { id: "msg-003" },
        error: null,
      });

      await sendInviteEmail({
        to: "user@example.com",
        inviteLink: "https://app.arenaone.com/invites/accept?token=abc",
        role: "ORGANIZATION_ADMIN",
        organizationName: "Test Org",
      });

      const callArgs = mockResendSend.mock.calls[0][0];
      expect(callArgs.html).toContain("You've been invited");
    });
  });
});
