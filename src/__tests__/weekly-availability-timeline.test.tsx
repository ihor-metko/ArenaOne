/**
 * @jest-environment jsdom
 */
import { isSlotBlocked } from "@/utils/slotBlocking";

/**
 * Tests for the slot blocking logic in WeeklyAvailabilityTimeline
 * 
 * Blocking rules:
 * - Past days: Any day before the current local date is blocked
 * - Today: Slots with slotStartHour < currentLocalHour are blocked
 * - Ongoing slots: If slotStartHour === currentLocalHour, the slot is ALLOWED
 *   This allows users to book slots that are currently in progress
 */
describe("isSlotBlocked utility function", () => {
  describe("Past day blocking", () => {
    it("should block slots from days before current date", () => {
      // Mock now = 2025-12-02T20:05:00
      const now = new Date(2025, 11, 2, 20, 5, 0); // Dec 2, 2025 20:05
      
      // Yesterday's slot should be blocked
      const result = isSlotBlocked("2025-12-01", 10, now);
      
      expect(result.isBlocked).toBe(true);
      expect(result.reason).toBe("past_day");
    });

    it("should block slots from much earlier days", () => {
      // Mock now = 2025-12-03
      const now = new Date(2025, 11, 3, 10, 0, 0);
      
      // All slots from Dec 2 should be blocked
      const result = isSlotBlocked("2025-12-02", 8, now);
      
      expect(result.isBlocked).toBe(true);
      expect(result.reason).toBe("past_day");
    });

    it("should block all hours from a past day regardless of hour", () => {
      // Mock now = 2025-12-03 at 08:00
      const now = new Date(2025, 11, 3, 8, 0, 0);
      
      // Even a late hour slot from yesterday should be blocked
      const result = isSlotBlocked("2025-12-02", 21, now);
      
      expect(result.isBlocked).toBe(true);
      expect(result.reason).toBe("past_day");
    });
  });

  describe("Same-day hour blocking", () => {
    it("should block slots where slotStartHour < currentLocalHour", () => {
      // Mock now = 2025-12-02T20:05:00
      const now = new Date(2025, 11, 2, 20, 5, 0);
      
      // Slot at 19:00 should be blocked (19 < 20)
      const result = isSlotBlocked("2025-12-02", 19, now);
      
      expect(result.isBlocked).toBe(true);
      expect(result.reason).toBe("past_hour");
    });

    it("should block earlier hour slots on the same day", () => {
      // Mock now = 2025-12-02T14:30:00
      const now = new Date(2025, 11, 2, 14, 30, 0);
      
      // Slot at 10:00 should be blocked
      const result10 = isSlotBlocked("2025-12-02", 10, now);
      expect(result10.isBlocked).toBe(true);
      expect(result10.reason).toBe("past_hour");
      
      // Slot at 13:00 should be blocked
      const result13 = isSlotBlocked("2025-12-02", 13, now);
      expect(result13.isBlocked).toBe(true);
      expect(result13.reason).toBe("past_hour");
    });
  });

  describe("Ongoing slot allowance (critical rule)", () => {
    it("should NOT block slot when slotStartHour === currentLocalHour", () => {
      // Mock now = 2025-12-02T20:05:00
      // A slot that starts at 20:00 should still be selectable at 20:05
      const now = new Date(2025, 11, 2, 20, 5, 0);
      
      const result = isSlotBlocked("2025-12-02", 20, now);
      
      expect(result.isBlocked).toBe(false);
      expect(result.reason).toBeNull();
    });

    it("should allow ongoing slot at the very start of the hour", () => {
      // Mock now = 2025-12-02T20:00:00
      const now = new Date(2025, 11, 2, 20, 0, 0);
      
      const result = isSlotBlocked("2025-12-02", 20, now);
      
      expect(result.isBlocked).toBe(false);
      expect(result.reason).toBeNull();
    });

    it("should allow ongoing slot at 59 minutes past the hour", () => {
      // Mock now = 2025-12-02T20:59:00
      const now = new Date(2025, 11, 2, 20, 59, 0);
      
      const result = isSlotBlocked("2025-12-02", 20, now);
      
      expect(result.isBlocked).toBe(false);
      expect(result.reason).toBeNull();
    });
  });

  describe("Future slot allowance", () => {
    it("should NOT block future hours on the same day", () => {
      // Mock now = 2025-12-02T14:30:00
      const now = new Date(2025, 11, 2, 14, 30, 0);
      
      // Slot at 15:00 should NOT be blocked
      const result15 = isSlotBlocked("2025-12-02", 15, now);
      expect(result15.isBlocked).toBe(false);
      expect(result15.reason).toBeNull();
      
      // Slot at 20:00 should NOT be blocked
      const result20 = isSlotBlocked("2025-12-02", 20, now);
      expect(result20.isBlocked).toBe(false);
      expect(result20.reason).toBeNull();
    });

    it("should NOT block slots on future days", () => {
      // Mock now = 2025-12-02T20:05:00
      const now = new Date(2025, 11, 2, 20, 5, 0);
      
      // Tomorrow's 8:00 slot should NOT be blocked
      const result = isSlotBlocked("2025-12-03", 8, now);
      
      expect(result.isBlocked).toBe(false);
      expect(result.reason).toBeNull();
    });

    it("should NOT block any slot on a future week", () => {
      // Mock now = 2025-12-02T20:05:00
      const now = new Date(2025, 11, 2, 20, 5, 0);
      
      // Next week's slot should NOT be blocked
      const result = isSlotBlocked("2025-12-09", 10, now);
      
      expect(result.isBlocked).toBe(false);
      expect(result.reason).toBeNull();
    });
  });

  describe("Acceptance criteria from issue", () => {
    it("Mock now=2025-12-02T20:05, slot at 2025-12-02T20:00 must be selectable", () => {
      const now = new Date(2025, 11, 2, 20, 5, 0);
      const result = isSlotBlocked("2025-12-02", 20, now);
      
      expect(result.isBlocked).toBe(false);
    });

    it("Mock now=2025-12-02T20:05, slot at 2025-12-02T19:00 must be blocked", () => {
      const now = new Date(2025, 11, 2, 20, 5, 0);
      const result = isSlotBlocked("2025-12-02", 19, now);
      
      expect(result.isBlocked).toBe(true);
      expect(result.reason).toBe("past_hour");
    });

    it("Mock now=2025-12-03, all slots for 2025-12-02 are blocked", () => {
      const now = new Date(2025, 11, 3, 10, 0, 0);
      
      // Check multiple hours on Dec 2
      const hours = [8, 10, 14, 18, 21];
      for (const hour of hours) {
        const result = isSlotBlocked("2025-12-02", hour, now);
        expect(result.isBlocked).toBe(true);
        expect(result.reason).toBe("past_day");
      }
    });
  });

  describe("Edge cases", () => {
    it("should handle midnight correctly", () => {
      // Mock now = 2025-12-02T00:00:00 (midnight)
      const now = new Date(2025, 11, 2, 0, 0, 0);
      
      // 00:00 slot should be allowed (ongoing)
      const result0 = isSlotBlocked("2025-12-02", 0, now);
      expect(result0.isBlocked).toBe(false);
      
      // Yesterday at 23:00 should be blocked
      const resultYesterday = isSlotBlocked("2025-12-01", 23, now);
      expect(resultYesterday.isBlocked).toBe(true);
      expect(resultYesterday.reason).toBe("past_day");
    });

    it("should handle end of day correctly", () => {
      // Mock now = 2025-12-02T23:45:00
      const now = new Date(2025, 11, 2, 23, 45, 0);
      
      // 23:00 slot should be allowed (ongoing at 23:45)
      const result = isSlotBlocked("2025-12-02", 23, now);
      expect(result.isBlocked).toBe(false);
      
      // 22:00 slot should be blocked
      const result22 = isSlotBlocked("2025-12-02", 22, now);
      expect(result22.isBlocked).toBe(true);
      expect(result22.reason).toBe("past_hour");
    });

    it("should handle year boundaries", () => {
      // Mock now = 2026-01-01T10:00:00
      const now = new Date(2026, 0, 1, 10, 0, 0);
      
      // Dec 31, 2025 should be blocked
      const result = isSlotBlocked("2025-12-31", 20, now);
      expect(result.isBlocked).toBe(true);
      expect(result.reason).toBe("past_day");
    });
  });
});
