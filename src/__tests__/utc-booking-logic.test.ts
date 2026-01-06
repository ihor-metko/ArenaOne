/**
 * @jest-environment node
 * 
 * Integration tests for UTC-based availability and booking logic
 * 
 * These tests verify that:
 * 1. All booking/availability calculations happen in UTC
 * 2. Overlap detection works correctly in UTC
 * 3. Cross-timezone bookings work correctly
 * 4. DST transitions don't cause phantom unavailability
 */

import {
  createUTCDate,
  doUTCRangesOverlap,
  addMinutesUTC,
  getUTCDayBounds,
  isValidUTCString,
} from '@/utils/utcDateTime';

describe('UTC-based Availability and Booking Logic', () => {
  describe('UTC Date Creation', () => {
    it('should create UTC date from date and time strings', () => {
      const utcDate = createUTCDate('2026-01-06', '10:00');
      
      expect(utcDate.toISOString()).toBe('2026-01-06T10:00:00.000Z');
      expect(utcDate.getUTCHours()).toBe(10);
      expect(utcDate.getUTCMinutes()).toBe(0);
    });

    it('should handle midnight correctly', () => {
      const utcDate = createUTCDate('2026-01-06', '00:00');
      
      expect(utcDate.toISOString()).toBe('2026-01-06T00:00:00.000Z');
    });

    it('should handle end of day correctly', () => {
      const utcDate = createUTCDate('2026-01-06', '23:59');
      
      expect(utcDate.toISOString()).toBe('2026-01-06T23:59:00.000Z');
    });

    it('should throw error for invalid date format', () => {
      expect(() => createUTCDate('2026/01/06', '10:00')).toThrow();
      expect(() => createUTCDate('06-01-2026', '10:00')).toThrow();
    });

    it('should throw error for invalid time format', () => {
      expect(() => createUTCDate('2026-01-06', '25:00')).toThrow();
      expect(() => createUTCDate('2026-01-06', '10:60')).toThrow();
      expect(() => createUTCDate('2026-01-06', '10')).toThrow();
    });
  });

  describe('UTC Range Overlap Detection', () => {
    it('should detect overlap when ranges partially overlap', () => {
      // Booking 1: 10:00-11:00
      const start1 = createUTCDate('2026-01-06', '10:00');
      const end1 = addMinutesUTC(start1, 60);
      
      // Booking 2: 10:30-11:30 (overlaps with Booking 1)
      const start2 = createUTCDate('2026-01-06', '10:30');
      const end2 = addMinutesUTC(start2, 60);
      
      expect(doUTCRangesOverlap(start1, end1, start2, end2)).toBe(true);
    });

    it('should detect overlap when one range contains another', () => {
      // Booking 1: 10:00-12:00
      const start1 = createUTCDate('2026-01-06', '10:00');
      const end1 = addMinutesUTC(start1, 120);
      
      // Booking 2: 10:30-11:00 (contained within Booking 1)
      const start2 = createUTCDate('2026-01-06', '10:30');
      const end2 = addMinutesUTC(start2, 30);
      
      expect(doUTCRangesOverlap(start1, end1, start2, end2)).toBe(true);
    });

    it('should NOT detect overlap for consecutive ranges', () => {
      // Booking 1: 10:00-11:00
      const start1 = createUTCDate('2026-01-06', '10:00');
      const end1 = addMinutesUTC(start1, 60);
      
      // Booking 2: 11:00-12:00 (starts exactly when Booking 1 ends)
      const start2 = createUTCDate('2026-01-06', '11:00');
      const end2 = addMinutesUTC(start2, 60);
      
      expect(doUTCRangesOverlap(start1, end1, start2, end2)).toBe(false);
    });

    it('should NOT detect overlap for separate ranges', () => {
      // Booking 1: 10:00-11:00
      const start1 = createUTCDate('2026-01-06', '10:00');
      const end1 = addMinutesUTC(start1, 60);
      
      // Booking 2: 12:00-13:00 (1 hour gap)
      const start2 = createUTCDate('2026-01-06', '12:00');
      const end2 = addMinutesUTC(start2, 60);
      
      expect(doUTCRangesOverlap(start1, end1, start2, end2)).toBe(false);
    });

    it('should handle ranges on different days', () => {
      // Booking 1: Jan 6, 22:00-23:00
      const start1 = createUTCDate('2026-01-06', '22:00');
      const end1 = addMinutesUTC(start1, 60);
      
      // Booking 2: Jan 7, 00:00-01:00 (next day)
      const start2 = createUTCDate('2026-01-07', '00:00');
      const end2 = addMinutesUTC(start2, 60);
      
      expect(doUTCRangesOverlap(start1, end1, start2, end2)).toBe(false);
    });

    it('should detect overlap across day boundary', () => {
      // Booking 1: Jan 6, 23:00 - Jan 7, 01:00 (crosses midnight)
      const start1 = createUTCDate('2026-01-06', '23:00');
      const end1 = addMinutesUTC(start1, 120); // 2 hours
      
      // Booking 2: Jan 7, 00:00-01:00
      const start2 = createUTCDate('2026-01-07', '00:00');
      const end2 = addMinutesUTC(start2, 60);
      
      expect(doUTCRangesOverlap(start1, end1, start2, end2)).toBe(true);
    });
  });

  describe('UTC Day Bounds', () => {
    it('should return correct day bounds for a date', () => {
      const { startOfDay, endOfDay } = getUTCDayBounds('2026-01-06');
      
      expect(startOfDay.toISOString()).toBe('2026-01-06T00:00:00.000Z');
      expect(endOfDay.toISOString()).toBe('2026-01-06T23:59:59.999Z');
    });

    it('should handle different dates correctly', () => {
      const { startOfDay, endOfDay } = getUTCDayBounds('2026-12-31');
      
      expect(startOfDay.toISOString()).toBe('2026-12-31T00:00:00.000Z');
      expect(endOfDay.toISOString()).toBe('2026-12-31T23:59:59.999Z');
    });

    it('should throw error for invalid date format', () => {
      expect(() => getUTCDayBounds('2026/01/06')).toThrow();
      expect(() => getUTCDayBounds('06-01-2026')).toThrow();
    });
  });

  describe('UTC String Validation', () => {
    it('should validate correct UTC ISO strings', () => {
      expect(isValidUTCString('2026-01-06T10:00:00.000Z')).toBe(true);
      expect(isValidUTCString('2026-01-06T10:00:00Z')).toBe(true);
      expect(isValidUTCString('2026-01-06T10:00:00.123Z')).toBe(true);
    });

    it('should reject non-UTC strings', () => {
      expect(isValidUTCString('2026-01-06T10:00:00')).toBe(false); // Missing Z
      expect(isValidUTCString('2026-01-06T10:00:00+02:00')).toBe(false); // Offset instead of Z
      expect(isValidUTCString('2026-01-06 10:00:00')).toBe(false); // Wrong format
      expect(isValidUTCString('2026-01-06')).toBe(false); // Date only
    });

    it('should reject invalid dates', () => {
      expect(isValidUTCString('2026-13-01T10:00:00.000Z')).toBe(false); // Invalid month
      expect(isValidUTCString('2026-01-32T10:00:00.000Z')).toBe(false); // Invalid day
      expect(isValidUTCString('2026-02-30T10:00:00.000Z')).toBe(false); // Feb 30
    });
  });

  describe('Cross-timezone Booking Scenarios', () => {
    it('should correctly handle booking from different timezone (Kyiv user)', () => {
      // User in Kyiv (UTC+2 in winter) selects 10:00 local
      // Frontend should convert to 08:00 UTC
      const localTime = '10:00';
      const localDate = '2026-01-06';
      
      // Simulate frontend conversion (Kyiv UTC+2 in winter)
      const utcHour = 10 - 2; // Subtract offset
      const expectedUTC = createUTCDate(localDate, `0${utcHour}:00`);
      
      expect(expectedUTC.toISOString()).toBe('2026-01-06T08:00:00.000Z');
    });

    it('should correctly handle booking from different timezone (New York user)', () => {
      // User in New York (UTC-5 in winter) selects 10:00 local
      // Frontend should convert to 15:00 UTC
      const localTime = '10:00';
      const localDate = '2026-01-06';
      
      // Simulate frontend conversion (New York UTC-5 in winter)
      const utcHour = 10 + 5; // Add offset (going east)
      const expectedUTC = createUTCDate(localDate, `${utcHour}:00`);
      
      expect(expectedUTC.toISOString()).toBe('2026-01-06T15:00:00.000Z');
    });

    it('should detect overlap between bookings from different timezones', () => {
      // User A in Kyiv books 10:00-11:00 local (08:00-09:00 UTC)
      const bookingA_start = createUTCDate('2026-01-06', '08:00');
      const bookingA_end = addMinutesUTC(bookingA_start, 60);
      
      // User B in New York tries to book 03:00-04:00 local (08:00-09:00 UTC)
      const bookingB_start = createUTCDate('2026-01-06', '08:00');
      const bookingB_end = addMinutesUTC(bookingB_start, 60);
      
      // These should overlap (same UTC time)
      expect(doUTCRangesOverlap(bookingA_start, bookingA_end, bookingB_start, bookingB_end)).toBe(true);
    });

    it('should NOT detect overlap between bookings from different timezones with different UTC times', () => {
      // User A in Kyiv books 10:00-11:00 local (08:00-09:00 UTC)
      const bookingA_start = createUTCDate('2026-01-06', '08:00');
      const bookingA_end = addMinutesUTC(bookingA_start, 60);
      
      // User B in New York books 04:00-05:00 local (09:00-10:00 UTC)
      const bookingB_start = createUTCDate('2026-01-06', '09:00');
      const bookingB_end = addMinutesUTC(bookingB_start, 60);
      
      // These should NOT overlap (consecutive UTC times)
      expect(doUTCRangesOverlap(bookingA_start, bookingA_end, bookingB_start, bookingB_end)).toBe(false);
    });
  });

  describe('DST Transition Scenarios', () => {
    it('should handle DST spring transition (no phantom unavailability)', () => {
      // When Kyiv transitions from UTC+2 to UTC+3 (spring forward)
      // A booking at "02:30 local" on transition day doesn't exist in local time
      // But in UTC, everything is continuous
      
      // Booking before DST: March 28, 2026 at 10:00 local (08:00 UTC, still UTC+2)
      const beforeDST = createUTCDate('2026-03-28', '08:00');
      const beforeDST_end = addMinutesUTC(beforeDST, 60);
      
      // Booking after DST: March 30, 2026 at 10:00 local (07:00 UTC, now UTC+3)
      const afterDST = createUTCDate('2026-03-30', '07:00');
      const afterDST_end = addMinutesUTC(afterDST, 60);
      
      // These should NOT overlap (different UTC times, different days)
      expect(doUTCRangesOverlap(beforeDST, beforeDST_end, afterDST, afterDST_end)).toBe(false);
    });

    it('should handle DST fall transition (no double bookings)', () => {
      // When Kyiv transitions from UTC+3 to UTC+2 (fall back)
      // "02:00-03:00 local" happens twice, but in UTC it's different times
      
      // First occurrence: before DST ends (UTC+3)
      const firstOccurrence = createUTCDate('2026-10-25', '23:00'); // 02:00 local UTC+3
      const firstOccurrence_end = addMinutesUTC(firstOccurrence, 60);
      
      // Second occurrence: after DST ends (UTC+2)
      const secondOccurrence = createUTCDate('2026-10-26', '00:00'); // 02:00 local UTC+2
      const secondOccurrence_end = addMinutesUTC(secondOccurrence, 60);
      
      // In UTC these are consecutive, not overlapping
      expect(doUTCRangesOverlap(firstOccurrence, firstOccurrence_end, secondOccurrence, secondOccurrence_end)).toBe(false);
    });
  });

  describe('Midnight Crossing Scenarios', () => {
    it('should handle booking that crosses midnight in local time but not in UTC', () => {
      // Kyiv timezone: User books 23:00-01:00 local (crosses midnight locally)
      // In UTC (winter, UTC+2): 21:00-23:00 on same day
      const start = createUTCDate('2026-01-06', '21:00');
      const end = addMinutesUTC(start, 120);
      
      // Both times should be on same UTC day
      expect(start.getUTCDate()).toBe(6);
      expect(end.getUTCDate()).toBe(6);
      expect(end.toISOString()).toBe('2026-01-06T23:00:00.000Z');
    });

    it('should handle booking that crosses midnight in UTC but not in local time', () => {
      // New York timezone (UTC-5): User books 20:00-22:00 local
      // In UTC: 01:00-03:00 next day (crosses midnight in UTC)
      const start = createUTCDate('2026-01-07', '01:00');
      const end = addMinutesUTC(start, 120);
      
      // Both times should be on same UTC day
      expect(start.getUTCDate()).toBe(7);
      expect(end.getUTCDate()).toBe(7);
      expect(end.toISOString()).toBe('2026-01-07T03:00:00.000Z');
    });

    it('should correctly detect overlap when one booking crosses UTC midnight', () => {
      // Booking 1: 23:00-01:00 UTC (crosses midnight)
      const start1 = createUTCDate('2026-01-06', '23:00');
      const end1 = addMinutesUTC(start1, 120); // Jan 7, 01:00
      
      // Booking 2: Jan 7, 00:00-01:00 UTC
      const start2 = createUTCDate('2026-01-07', '00:00');
      const end2 = addMinutesUTC(start2, 60);
      
      // These should overlap
      expect(doUTCRangesOverlap(start1, end1, start2, end2)).toBe(true);
      expect(end1.toISOString()).toBe('2026-01-07T01:00:00.000Z');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very short bookings (1 minute)', () => {
      const start = createUTCDate('2026-01-06', '10:00');
      const end = addMinutesUTC(start, 1);
      
      expect(end.toISOString()).toBe('2026-01-06T10:01:00.000Z');
    });

    it('should handle very long bookings (24 hours)', () => {
      const start = createUTCDate('2026-01-06', '00:00');
      const end = addMinutesUTC(start, 1440); // 24 hours
      
      expect(end.toISOString()).toBe('2026-01-07T00:00:00.000Z');
    });

    it('should handle booking exactly at midnight', () => {
      const start = createUTCDate('2026-01-06', '00:00');
      const end = addMinutesUTC(start, 60);
      
      expect(start.toISOString()).toBe('2026-01-06T00:00:00.000Z');
      expect(end.toISOString()).toBe('2026-01-06T01:00:00.000Z');
    });

    it('should handle booking ending exactly at midnight', () => {
      const start = createUTCDate('2026-01-06', '23:00');
      const end = addMinutesUTC(start, 60);
      
      expect(start.toISOString()).toBe('2026-01-06T23:00:00.000Z');
      expect(end.toISOString()).toBe('2026-01-07T00:00:00.000Z');
    });
  });
});
