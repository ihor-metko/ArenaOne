# Courts Page Filters, Sorting, and Search

## Overview

The Courts page (`/admin/courts`) provides a comprehensive interface for administrators to manage courts across clubs and organizations. It includes advanced filtering, sorting, search, and pagination capabilities with role-based access control.

## Features Summary

**Filters Available:**
- Organization (Root Admin only)
- Club (Root/Org Admin)
- Court Name Search
- Sport Type (Padel, Tennis, Squash, Badminton, Pickleball)
- Surface Type (Hard, Clay, Grass, Artificial Grass, Carpet)
- Location (Indoor/Outdoor)
- Status (Active/Inactive)

**Sorting Options:**
- By Name (A-Z / Z-A)
- By Sport Type
- By Bookings Count (Most/Least)
- By Created Date (Newest/Oldest)

**Additional Features:**
- Persistent filters via localStorage
- Role-based filter visibility
- Real-time search with debouncing
- Pagination with customizable page sizes
- Server-side processing for performance
- Full internationalization (EN/UK)

## Role-Based Access Control

### Root Admin
- Sees all courts across all organizations
- All filters visible
- Can view, edit, and delete courts

### Organization Admin
- Sees courts in clubs belonging to their organizations
- Club filter and other filters visible (no Org filter)
- Can view and edit courts

### Club Admin
- Sees only courts in their assigned club(s)
- Basic filters only (no Org/Club filters)
- Limited edit access

## Technical Implementation

### API Endpoint

`GET /api/admin/courts`

**Query Parameters:**
- `search` - Search by court name
- `clubId` - Filter by club ID
- `status` - Filter by status (active/inactive/all)
- `sportType` - Filter by sport type
- `surfaceType` - Filter by surface type
- `indoor` - Filter by location (indoor/outdoor/all)
- `sortBy` - Sort field (name/sportType/bookings/createdAt)
- `sortOrder` - Sort direction (asc/desc)
- `page` - Page number
- `limit` - Items per page

### State Management

Uses `useListController` hook for:
- Persistent state in localStorage
- Automatic state restoration
- Debounced updates
- Filter combination logic

### UI Components

- `ListToolbar` - Filter container with reset button
- `ListSearch` - Debounced search input
- `OrgSelector` - Organization dropdown
- `ClubSelector` - Club dropdown
- `StatusFilter` - Generic filter dropdown
- `SortSelect` - Sorting dropdown
- `PaginationControls` - Pagination UI
- `Table` - Data display with sorting

## Testing

All tests passing:
- `admin-courts-api.test.ts` - API endpoint tests
- `admin-courts-page.test.tsx` - UI component tests

## Future Enhancements

Potential additions:
- Real-time availability filter
- Capacity/player count filter
- Date range filtering
- Bulk operations
- Export functionality
- Saved filter presets

## Related Files

- `/src/app/(pages)/admin/courts/page.tsx` - Main page component
- `/src/app/api/admin/courts/route.ts` - API endpoint
- `/locales/en.json` - English translations
- `/locales/uk.json` - Ukrainian translations
