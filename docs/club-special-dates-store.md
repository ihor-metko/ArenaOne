# Club Special Dates Store Migration

## Overview

Special Dates (non-working / shortened days) have been extracted from the club detail endpoint into a dedicated endpoint and Zustand store for independent management.

## Changes Made

### Backend Changes

#### 1. Club Detail Endpoint Modified
- **File**: `src/app/api/admin/clubs/[id]/route.ts`
- **Change**: Removed `specialHours` from the `include` clause in the GET endpoint
- **Impact**: Club detail endpoint no longer returns `specialHours` data

#### 2. Dedicated Special Dates Endpoints (Already Existed)
- `GET /api/admin/clubs/:clubId/special-dates` - List all special dates
- `POST /api/admin/clubs/:clubId/special-dates` - Create a special date
- `PATCH /api/admin/clubs/:clubId/special-dates/:id` - Update a special date
- `DELETE /api/admin/clubs/:clubId/special-dates/:id` - Delete a special date

### Frontend Changes

#### 1. New Store Created
- **File**: `src/stores/useClubSpecialDatesStore.ts`
- **Purpose**: Manage club special dates independently from club details
- **Features**:
  - Lazy loading with inflight request guards
  - Optimistic updates for create/update/delete operations
  - Automatic sorting by date
  - Follows existing Zustand patterns from `copilot-settings.md`

#### 2. Component Updated
- **File**: `src/components/admin/club/ClubSpecialDatesView.tsx`
- **Changes**:
  - Now subscribes to `useClubSpecialDatesStore` instead of club prop
  - Fetches special dates on mount via `useEffect`
  - Updates store directly after mutations (no club detail refetch)
  - UI reactively updates from store state

#### 3. Type Updates
- **File**: `src/types/club.ts`
- **Change**: Made `specialHours` optional in `ClubDetail` type

### Testing Changes

Updated tests to reflect new architecture:
- `src/__tests__/club-special-dates-view.test.tsx` - Mock special dates store
- `src/__tests__/admin-club-detail.test.ts` - Remove specialHours expectations

## Data Flow

### Before
```
Club Detail Page
  ↓
GET /api/admin/clubs/:id (includes specialHours)
  ↓
Club Detail + Special Dates rendered
  ↓
Mutation (create/update/delete)
  ↓
Refetch entire club detail (inefficient)
```

### After
```
Club Detail Page
  ↓
GET /api/admin/clubs/:id (without specialHours)
  +
GET /api/admin/clubs/:id/special-dates (special dates only)
  ↓
Club Detail + Special Dates rendered
  ↓
Mutation (create/update/delete)
  ↓
Update special dates store directly (efficient)
  ↓
UI updates reactively from store
```

## Benefits

1. **Performance**: No longer refetching entire club detail for special dates changes
2. **Separation of Concerns**: Special dates managed independently
3. **Scalability**: Pattern can be applied to other club sub-resources
4. **Consistency**: Follows existing Zustand patterns in the project

## Usage Example

```tsx
import { useClubSpecialDatesStore } from "@/stores/useClubSpecialDatesStore";

function MyComponent({ clubId }) {
  const specialDates = useClubSpecialDatesStore((state) => state.specialDates);
  const fetchSpecialDates = useClubSpecialDatesStore((state) => state.fetchSpecialDates);
  const loading = useClubSpecialDatesStore((state) => state.loading);
  
  useEffect(() => {
    fetchSpecialDates(clubId);
  }, [clubId, fetchSpecialDates]);
  
  return (
    <div>
      {loading ? "Loading..." : specialDates.map(sd => (
        <div key={sd.id}>{sd.date}</div>
      ))}
    </div>
  );
}
```

## Migration Notes

- The club creation flow still accepts `specialHours` in the POST payload - this is intentional for initial setup
- Existing special dates endpoints were already implemented and functional
- All tests pass after migration
- No UI/UX changes - only data flow refactoring
