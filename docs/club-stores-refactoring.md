# Club Stores and Endpoints Refactoring

## Overview

This document describes the refactoring of club data management in ArenaOne to provide clear separation between admin and player contexts.

## Problem Statement

Previously, the application used a single `useClubStore` for both admin and player features, which:
- Mixed admin-sensitive data with public player data
- Used the same endpoints (`/api/admin/clubs`) for both contexts
- Created potential security risks of exposing admin data to players
- Made it unclear which data was appropriate for which context

## Solution

Created two separate Zustand stores with dedicated API endpoints:

### 1. Admin Club Store (`useAdminClubStore`)

**Purpose**: Manage admin-level club data with full access rights

**Features**:
- Full CRUD operations (create, update, delete)
- Access to admin-sensitive data (admins list, statistics, payment info)
- Organization-based filtering
- Role-based server-side access control

**API Endpoints**:
- `GET /api/admin/clubs` - List clubs (role-filtered)
- `GET /api/admin/clubs/:id` - Get club details (full access)
- `POST /api/admin/clubs/new` - Create club
- `PUT /api/admin/clubs/:id` - Update club
- `DELETE /api/admin/clubs/:id` - Delete club

**Usage**:
```typescript
import { useAdminClubStore } from '@/stores/useAdminClubStore';

// In admin component
const clubs = useAdminClubStore(state => state.clubs);
const fetchClubsIfNeeded = useAdminClubStore(state => state.fetchClubsIfNeeded);

// Lazy load clubs
await fetchClubsIfNeeded({ organizationId: 'org-123' });

// Create club
await createClub(clubData);
```

### 2. Player Club Store (`usePlayerClubStore`)

**Purpose**: Manage public club data visible to all players

**Features**:
- Read-only access to public club data
- Search and filtering (by city, name)
- No access to admin-sensitive information
- Public data only (name, location, courts, schedule, coaches)

**API Endpoints**:
- `GET /api/clubs` - List public clubs (no auth required)
- `GET /api/clubs/:id` - Get public club details (no auth required)

**Usage**:
```typescript
import { usePlayerClubStore } from '@/stores/usePlayerClubStore';

// In player component
const clubs = usePlayerClubStore(state => state.clubs);
const ensureClubById = usePlayerClubStore(state => state.ensureClubById);

// Lazy load clubs with search
await fetchClubsIfNeeded({ search: 'tennis', city: 'Kyiv' });

// Get club details
const club = await ensureClubById('club-123');
```

## Migration Guide

### For Admin Components

**Before**:
```typescript
import { useClubStore } from '@/stores/useClubStore';

const clubs = useClubStore(state => state.clubs);
const fetchClubs = useClubStore(state => state.fetchClubs);
```

**After**:
```typescript
import { useAdminClubStore } from '@/stores/useAdminClubStore';

const clubs = useAdminClubStore(state => state.clubs);
const fetchClubsIfNeeded = useAdminClubStore(state => state.fetchClubsIfNeeded);
```

### For Player Components

**Before**:
```typescript
import { useClubStore } from '@/stores/useClubStore';

const clubs = useClubStore(state => state.clubs);
const fetchClubById = useClubStore(state => state.fetchClubById);
```

**After**:
```typescript
import { usePlayerClubStore } from '@/stores/usePlayerClubStore';

const clubs = usePlayerClubStore(state => state.clubs);
const ensureClubById = usePlayerClubStore(state => state.ensureClubById);
```

## Helper Functions

New helper functions have been added to `src/lib/storeHelpers.ts`:

### Admin Helpers

```typescript
// Ensure admin club is loaded
const club = await ensureAdminClubContext('club-123');

// Ensure clubs for organization
await ensureAdminClubsForOrganization('org-123');

// Invalidate admin cache
invalidateAdminClubs();

// Safe selector
const useClubNames = selectAdminClubs(clubs => clubs.map(c => c.name));
```

### Player Helpers

```typescript
// Ensure player club is loaded
const club = await ensurePlayerClubContext('club-123');

// Ensure player clubs (with optional filters)
await ensurePlayerClubs({ search: 'tennis' });

// Invalidate player cache
invalidatePlayerClubs();

// Safe selector
const useClubNames = selectPlayerClubs(clubs => clubs.map(c => c.name));
```

## Security Benefits

1. **Data Separation**: Admin endpoints require authentication; player endpoints are public
2. **No Data Leakage**: Admin data never exposed through player store
3. **Role-Based Access**: Server enforces admin roles for sensitive operations
4. **Clear Boundaries**: Type system prevents mixing admin/player data

## Performance Benefits

1. **Independent Caching**: Each store manages its own cache
2. **Inflight Guards**: Prevents duplicate concurrent requests
3. **Lazy Loading**: Data loaded only when needed
4. **Optimistic Updates**: Admin store supports optimistic UI updates

## Components Migrated

### Admin Components (14 files)
- Admin clubs list page
- Admin club detail page
- Admin bookings page
- Admin organizations page
- Admin courts creation page
- Operations pages (2)
- Payment accounts page
- Admin wizard component
- Booking wizard hooks (2)
- Operations selectors (2)
- List control selectors

### Player Components (4 files)
- Player club detail page
- Player dashboard
- Player quick booking
- Personalized section

## API Route Structure

```
/api/
├── admin/
│   └── clubs/              # Admin-only, auth required
│       ├── route.ts        # GET (list), POST deprecated
│       ├── new/
│       │   └── route.ts    # POST (create)
│       └── [id]/
│           └── route.ts    # GET, PUT, DELETE
│
└── (player)/              # Route group (stripped from URL)
    └── clubs/             # Public, no auth
        ├── route.ts       # GET (list)
        └── [id]/
            └── route.ts   # GET (detail)
```

**Note**: The `(player)` directory is a Next.js route group and is stripped from URLs. The actual endpoint is `/api/clubs`, not `/api/(player)/clubs`.

## Backward Compatibility

The old `useClubStore` has been marked as deprecated but remains functional for:
- Existing tests that reference it
- Gradual migration if needed
- Third-party integrations (if any)

**Important**: New code should NOT use `useClubStore`. Use the appropriate new store instead.

## Testing

### Manual Testing Checklist

- [ ] Admin can view all clubs in their scope (org/club specific)
- [ ] Admin can create new clubs
- [ ] Admin can update club details
- [ ] Admin can delete clubs
- [ ] Player can view public clubs only
- [ ] Player cannot access admin endpoints
- [ ] Player cannot see admin-sensitive data (admins, payment info)
- [ ] Search and filtering work for player clubs
- [ ] Caching works correctly for both stores
- [ ] No duplicate requests when multiple components load same club

### Security Testing

- [ ] `/api/admin/clubs` requires authentication
- [ ] `/api/admin/clubs` respects role-based access
- [ ] `/api/clubs` returns only public clubs
- [ ] `/api/clubs` filters by organization `isPublic` flag
- [ ] Player store never receives admin data
- [ ] Admin store is not accessible from player components

## Future Enhancements

1. **Additional Filters**: Add more filtering options for player clubs (sport type, indoor/outdoor)
2. **Real-time Updates**: Implement WebSocket updates for club availability
3. **Pagination**: Add server-side pagination for large club lists
4. **Club Analytics**: Add analytics tracking in admin store
5. **Favorites**: Add favorite clubs feature for players

## Related Documentation

- [Zustand State Management Guidelines](../copilot-settings.md#5-state-management-guidelines-zustand)
- [Role-Based Access Control](../copilot-settings.md#1-universal-role-based-access-control)
- [API Routes Documentation](../api-routes.md) (if exists)

## Support

For questions or issues related to this refactoring:
1. Check this documentation first
2. Review the code comments in store files
3. Check migration examples above
4. Consult with the development team
