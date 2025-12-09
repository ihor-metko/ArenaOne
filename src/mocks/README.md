# Mocks Infrastructure

This directory contains development-only mock data for the RSP (Racket Sports Platform) application.

## Purpose

Mock data allows developers to:
- Work on UI/UX without requiring a fully configured database
- Test different data scenarios easily
- Develop features when backend APIs are not yet available
- Speed up development iteration cycles

## Usage

### Enabling Mock Mode

Set the `NEXT_PUBLIC_USE_MOCKS` environment variable to enable mock mode:

```bash
export NEXT_PUBLIC_USE_MOCKS=true
```

Or add it to your `.env.local` file:

```
NEXT_PUBLIC_USE_MOCKS=true
```

### Using Mocks in Components

Use the `useMocks()` helper function to conditionally load mock data:

```typescript
import { useMocks } from '@/mocks';
import { getMockOrganizationDetail } from '@/mocks/admin/organization-detail';

// In your component or data-fetching logic
if (useMocks()) {
  // Use mock data
  const orgData = getMockOrganizationDetail(orgId);
  setOrg(orgData);
} else {
  // Use real API
  const response = await fetch(`/api/orgs/${orgId}`);
  const orgData = await response.json();
  setOrg(orgData);
}
```

## Available Mocks

### Admin Mocks

#### organization-detail.ts

Mock data for the Organization Detail page. Shows how to enable the detail mock via `NEXT_PUBLIC_USE_MOCKS=true`.

Provides three variants:
- **Large Organization** (default): 5 clubs, 18 courts, 342 active users
- **Medium Organization**: 2 clubs, 7 courts, 128 active users  
- **Small Organization**: 1 club, 3 courts, 42 active users

Each variant includes:
- Complete organization information (name, slug, contact details)
- Super admins with primary owner designation
- Club previews with court counts and admin counts
- Club admin assignments
- Recent activity log
- User preview data with summary statistics

The mock automatically selects a variant based on the orgId pattern for variety in testing.

## Directory Structure

```
src/mocks/
├── index.ts                           # Core helper functions (useMocks)
├── admin/
│   └── organization-detail.ts         # Organization Detail page mocks
└── README.md                          # This file
```

## Best Practices

1. **Keep Mocks Realistic**: Mock data should closely resemble real data structures and business logic
2. **Guard with useMocks()**: Always check `useMocks()` before using mock data to ensure production safety
3. **Document Variants**: When creating multiple mock variants, document what each represents
4. **Match API Shapes**: Mock data structures should exactly match real API response shapes
5. **Include Edge Cases**: Consider including mocks for empty states, error conditions, and boundary cases

## Safety

- Mock data is **NEVER** used in production builds
- All mock usage must be guarded by `useMocks()` checks
- The `NEXT_PUBLIC_USE_MOCKS` variable is only read in development mode
- Real API/store calls remain intact when mocks are disabled

## Adding New Mocks

To add mocks for a new page or feature:

1. Create a new file in the appropriate subdirectory (e.g., `src/mocks/admin/new-feature.ts`)
2. Export typed mock data variants
3. Export helper functions to retrieve mocks (e.g., `getMockFeatureData()`)
4. Update the component/page to use `useMocks()` and load mocks conditionally
5. Document the new mock in this README

## Notes

- This mocks system is separate from the legacy `USE_MOCK_DATA` system in `src/services/mockDb.ts`
- Both systems can coexist during transition
- Prefer using this `NEXT_PUBLIC_USE_MOCKS` system for new features
