# Special Dates Refactoring - UI Changes

## Overview
This document describes the UI changes made to separate Business Hours and Special Dates into distinct blocks on the club detail page.

## Before (Original Implementation)

### Single "Business Hours" Block
The original implementation combined both regular hours and special dates in a single card:

```
┌─────────────────────────────────────────┐
│ Business Hours                    [Edit]│
├─────────────────────────────────────────┤
│ Weekly Schedule:                        │
│ Monday      9:00 AM - 9:00 PM          │
│ Tuesday     9:00 AM - 9:00 PM          │
│ Wednesday   9:00 AM - 9:00 PM          │
│ Thursday    9:00 AM - 9:00 PM          │
│ Friday      9:00 AM - 9:00 PM          │
│ Saturday    10:00 AM - 6:00 PM         │
│ Sunday      Closed                      │
│                                         │
│ Special Hours:                          │
│ 12/25/2024  Closed (Christmas)         │
│ 2/14/2025   10:00 AM - 6:00 PM         │
│             (Valentine's Day)           │
└─────────────────────────────────────────┘
```

**Edit Modal:** Single modal containing both business hours and special hours fields

## After (New Implementation)

### Separate "Business Hours" and "Special Dates" Blocks

#### Block 1: Business Hours (Weekly Schedule Only)
```
┌─────────────────────────────────────────┐
│ Business Hours                    [Edit]│
├─────────────────────────────────────────┤
│ Monday      9:00 AM - 9:00 PM          │
│ Tuesday     9:00 AM - 9:00 PM          │
│ Wednesday   9:00 AM - 9:00 PM          │
│ Thursday    9:00 AM - 9:00 PM          │
│ Friday      9:00 AM - 9:00 PM          │
│ Saturday    10:00 AM - 6:00 PM         │
│ Sunday      Closed                      │
└─────────────────────────────────────────┘
```

**Edit Modal:** Only contains business hours editor (weekly schedule)

#### Block 2: Special Dates (Separate Card Below)
```
┌─────────────────────────────────────────┐
│ Special Dates                     [Edit]│
├─────────────────────────────────────────┤
│ Dec 25 — Closed (Christmas)            │
│ Feb 14 — 10:00 AM - 6:00 PM           │
│          (Valentine's Day)              │
└─────────────────────────────────────────┘
```

**Edit Modal:** Only contains special hours editor (date exceptions)

## Key Improvements

### 1. **Clear Separation of Concerns**
- Regular weekly hours are kept distinct from special date exceptions
- Each block has a focused purpose and single responsibility
- Easier for users to understand the difference between recurring and one-time schedules

### 2. **Better User Experience**
- Users can edit business hours without seeing special dates (and vice versa)
- Cleaner, less cluttered interface
- Faster editing workflow - edit only what you need

### 3. **Improved Readability**
- Special dates use a concise format: "Month Day — Status (Reason)"
- Examples: "Dec 25 — Closed", "Feb 14 — shortened day"
- No unnecessary clutter when there are no special dates

### 4. **Independent Edit Modals**
- Business Hours modal focuses on weekly recurring schedule
- Special Dates modal focuses on date exceptions and reasons
- Each modal is simpler and more focused

## Technical Implementation

### Component Structure
```
ClubDetailPage
├── ClubContactsView (existing)
├── ClubHoursView (modified - weekly hours only)
└── ClubSpecialDatesView (new - special dates only)
```

### Data Flow
Both components use the same API endpoint (`/api/admin/clubs/[id]/section` with section="hours") but:
- **ClubHoursView** updates only `businessHours`, preserves `specialHours`
- **ClubSpecialDatesView** updates only `specialHours`, preserves `businessHours`

This ensures backward compatibility and prevents data loss when editing either section independently.

## Empty States

### No Business Hours
```
┌─────────────────────────────────────────┐
│ Business Hours                    [Edit]│
├─────────────────────────────────────────┤
│ No hours set                            │
└─────────────────────────────────────────┘
```

### No Special Dates
```
┌─────────────────────────────────────────┐
│ Special Dates                     [Edit]│
├─────────────────────────────────────────┤
│ No special dates set                    │
└─────────────────────────────────────────┘
```

## Location in UI

The blocks appear in the right column of the club detail page, in this order:
1. Contact Info
2. Business Hours (weekly schedule)
3. Special Dates (date exceptions) ← **NEW**

All blocks follow the same design pattern with consistent styling and behavior.
