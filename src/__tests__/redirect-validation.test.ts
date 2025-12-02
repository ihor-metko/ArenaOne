/**
 * @jest-environment node
 */

import { validateRedirectUrl } from "@/utils/redirectValidation";

describe("validateRedirectUrl", () => {
  describe("valid relative URLs", () => {
    it("should accept simple relative paths", () => {
      expect(validateRedirectUrl("/clubs")).toBe("/clubs");
      expect(validateRedirectUrl("/clubs/123")).toBe("/clubs/123");
      expect(validateRedirectUrl("/auth/sign-in")).toBe("/auth/sign-in");
    });

    it("should accept relative paths with query parameters", () => {
      expect(validateRedirectUrl("/clubs?page=2")).toBe("/clubs?page=2");
      expect(validateRedirectUrl("/courts/123?date=2024-01-01")).toBe("/courts/123?date=2024-01-01");
    });

    it("should accept relative paths with hash fragments", () => {
      expect(validateRedirectUrl("/clubs#section1")).toBe("/clubs#section1");
    });

    it("should accept root path", () => {
      expect(validateRedirectUrl("/")).toBe("/");
    });

    it("should accept encoded relative URLs", () => {
      expect(validateRedirectUrl("/clubs/My%20Club")).toBe("/clubs/My%20Club");
    });
  });

  describe("invalid URLs", () => {
    it("should reject null and undefined", () => {
      expect(validateRedirectUrl(null)).toBeNull();
      expect(validateRedirectUrl(undefined)).toBeNull();
    });

    it("should reject empty string", () => {
      expect(validateRedirectUrl("")).toBeNull();
    });

    it("should reject absolute URLs", () => {
      expect(validateRedirectUrl("https://evil.com")).toBeNull();
      expect(validateRedirectUrl("http://evil.com")).toBeNull();
      expect(validateRedirectUrl("ftp://evil.com")).toBeNull();
    });

    it("should reject protocol-relative URLs", () => {
      expect(validateRedirectUrl("//evil.com")).toBeNull();
      expect(validateRedirectUrl("//evil.com/path")).toBeNull();
    });

    it("should reject relative URLs that don't start with /", () => {
      expect(validateRedirectUrl("clubs")).toBeNull();
      expect(validateRedirectUrl("clubs/123")).toBeNull();
    });

    it("should reject javascript: URLs", () => {
      expect(validateRedirectUrl("javascript:alert(1)")).toBeNull();
    });

    it("should reject data: URLs", () => {
      expect(validateRedirectUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    });

    it("should reject URLs with backslash tricks", () => {
      expect(validateRedirectUrl("/\\evil.com")).toBeNull();
      expect(validateRedirectUrl("/\\\\evil.com")).toBeNull();
    });

    it("should reject whitespace-only strings", () => {
      expect(validateRedirectUrl("   ")).toBeNull();
      expect(validateRedirectUrl("\t\n")).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should trim leading and trailing whitespace from valid URLs", () => {
      expect(validateRedirectUrl("  /clubs  ")).toBe("/clubs");
      expect(validateRedirectUrl("\t/clubs\n")).toBe("/clubs");
    });

    it("should reject URLs that look relative but could be normalized to absolute", () => {
      // These could potentially be exploited through browser normalization
      expect(validateRedirectUrl("/\\evil.com")).toBeNull();
    });

    it("should reject URLs with encoded protocol-relative patterns", () => {
      // %2F%2F decodes to //
      expect(validateRedirectUrl("%2F%2Fevil.com")).toBeNull();
    });

    it("should handle complex valid paths", () => {
      expect(validateRedirectUrl("/clubs/123/courts/456?date=2024-01-01&time=10:00#booking")).toBe(
        "/clubs/123/courts/456?date=2024-01-01&time=10:00#booking"
      );
    });
  });

  describe("security scenarios", () => {
    it("should prevent open redirect attacks", () => {
      // Common open redirect attack vectors
      const attackVectors = [
        "https://attacker.com",
        "//attacker.com",
        "http://attacker.com",
        "/\\attacker.com",
        "javascript:alert(document.domain)",
        "data:text/html,<script>alert(1)</script>",
        "%0d%0aLocation:%20http://attacker.com",
      ];

      for (const vector of attackVectors) {
        expect(validateRedirectUrl(vector)).toBeNull();
      }
    });

    it("should only allow same-origin navigation", () => {
      // Valid same-origin paths should work
      expect(validateRedirectUrl("/")).not.toBeNull();
      expect(validateRedirectUrl("/clubs")).not.toBeNull();
      expect(validateRedirectUrl("/courts/123")).not.toBeNull();

      // Cross-origin attempts should fail
      expect(validateRedirectUrl("https://other-site.com")).toBeNull();
      expect(validateRedirectUrl("//other-site.com")).toBeNull();
    });
  });
});
