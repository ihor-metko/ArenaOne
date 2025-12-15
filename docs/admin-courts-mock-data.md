# Admin Courts Mock Data Implementation

## Overview

This document describes the mock data infrastructure added to support the Admin Courts page (`/admin/clubs/[id]/courts`) during development when the database is unavailable.

## Changes Made

### 1. Mock Data Functions (`src/services/mockDb.ts`)

Added a new function to create mock courts:

```typescript
export function createMockCourt(data: {
  clubId: string;
  name: string;
  slug?: string | null;
  type?: string | null;
  surface?: string | null;
  indoor?: boolean;
  sportType?: string;
  defaultPriceCents?: number;
}): Court
```

This function:
- Generates a unique court ID
- Creates a new court with the provided data
- Uses sensible defaults (e.g., `sportType: "PADEL"`, `indoor: false`, `isActive: true`)
- Adds the court to the mock courts array
- Returns the created court

### 2. Mock API Handlers (`src/services/mockApiHandlers.ts`)

Added a new mock handler for creating courts in a specific club:

```typescript
export async function mockCreateCourtForClub(
  clubId: string,
  data: { ... }
): Promise<CourtResponse>
```

This handler:
- Validates that the club exists
- Creates the court using `createMockCourt`
- Returns the court in the format expected by the API

### 3. New API Route (`src/app/api/clubs/[id]/courts/route.ts`)

Created a new API route that:

#### GET `/api/clubs/[clubId]/courts`
- Returns all courts for a specific club
- Supports filtering by search, status
- Supports sorting by name, bookings, createdAt
- Supports pagination (page, limit)
- Uses mock mode when `USE_MOCK_DATA=true`
- Requires club admin authorization

#### POST `/api/clubs/[clubId]/courts`
- Creates a new court for the specified club
- Validates required fields (name)
- Uses mock mode when `USE_MOCK_DATA=true`
- Requires club admin authorization

### 4. Bug Fixes

Fixed inconsistent mock data IDs:
- Changed first organization ID from UUID to `"org-1"` for consistency
- Changed first club ID from UUID to `"club-1"` for consistency
- These changes align with how courts and other entities reference these IDs

### 5. Tests

Added test coverage in `src/__tests__/mock-mode.test.ts`:
- Test for creating a new court
- Validates that the court is added to the mock data
- Ensures proper field values

## How It Works

### Mock Mode Activation

Mock mode is controlled by the environment variable `USE_MOCK_DATA`:

```bash
USE_MOCK_DATA=true npm run dev
```

When enabled:
1. The API route checks `isMockMode()`
2. If true, it uses `mockGetCourts` or `mockCreateCourtForClub` instead of Prisma
3. The mock handlers operate on in-memory data structures

### Existing Mock Data

The mock database already includes courts for testing:
- 3 courts for "Downtown Padel Club" (club-1)
- 2 courts for "Suburban Padel Center" (club-2)
- 2 courts for "Elite Padel Academy" (club-3)
- And more...

### Admin Courts Page Integration

The Admin Courts page (`/admin/clubs/[id]/courts/page.tsx`) uses the court store which:
1. Calls `fetchCourtsIfNeeded({ clubId })`
2. Makes a GET request to `/api/clubs/${clubId}/courts`
3. The route returns mock data when in mock mode
4. The page renders the courts seamlessly

## Usage Example

### Fetching Courts
```typescript
// In the Admin Courts page
const fetchCourtsIfNeeded = useCourtStore((state) => state.fetchCourtsIfNeeded);

useEffect(() => {
  fetchCourtsIfNeeded({ clubId }).catch(console.error);
}, [clubId, fetchCourtsIfNeeded]);
```

### Creating a Court
```typescript
// In the Admin Courts page
const createCourt = useCourtStore((state) => state.createCourt);

await createCourt(clubId, {
  name: "New Court",
  type: "padel",
  surface: "artificial_grass",
  indoor: true,
  defaultPriceCents: 5000,
});
```

## Testing

Run the mock mode tests:
```bash
npm test -- mock-mode.test.ts
```

## File Structure

```
src/
├── app/api/clubs/[id]/courts/
│   └── route.ts                    # New API route
├── services/
│   ├── mockDb.ts                   # Added createMockCourt
│   └── mockApiHandlers.ts          # Added mockCreateCourtForClub
└── __tests__/
    └── mock-mode.test.ts           # Added court creation test
```

## Future Cleanup

When the database is fixed and mock mode is no longer needed:
1. Remove the mock mode checks from the API routes
2. Remove mock handlers from `mockApiHandlers.ts`
3. Remove mock CRUD functions from `mockDb.ts`
4. See `TODO_MOCK_CLEANUP.md` for complete cleanup instructions
