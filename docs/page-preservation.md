# Universal Page Preservation Mechanism

## Overview
The PagePreserveProvider is a universal solution that preserves the current page and query parameters across browser reloads. It's implemented as a provider component in the root layout, eliminating the need for per-page preservation logic.

## Implementation Details

### Location
- **Component**: `src/components/PagePreserveProvider.tsx`
- **Integration**: Added to `src/app/layout.tsx` as a provider wrapping all content
- **Tests**: `src/__tests__/page-preserve-provider.test.tsx`

### How It Works

1. **Saving the Current Page**
   - Monitors pathname and query parameters using Next.js hooks (`usePathname`, `useSearchParams`)
   - Automatically saves the full URL (with query parameters) to sessionStorage
   - Key used: `arena_last_page`
   - Excludes auth pages and root path from being saved

2. **Restoring the Page**
   - On app initialization, checks if user is on the root path (`/`)
   - If a saved URL exists in sessionStorage, redirects to that URL
   - Uses `router.replace()` to avoid adding to browser history
   - Skips restoration for excluded paths (auth pages)

3. **Excluded Paths**
   - `/auth/sign-in` - Login page
   - `/auth/sign-up` - Registration page
   - `/invites/accept` - Invite acceptance page
   
   These paths are excluded to prevent redirect loops and ensure users can always access authentication flows.

### Integration

The provider is added to the root layout in this position:

```tsx
<AuthProvider>
  <PagePreserveProvider>
    <ClubProvider>
      <!-- Rest of the app -->
    </ClubProvider>
  </PagePreserveProvider>
</AuthProvider>
```

This ensures:
- It runs after authentication is initialized
- It wraps all application content
- No per-page configuration is needed

## Supported Pages

The page preservation works automatically for all pages, including:

- **Admin Pages**:
  - `/admin/clubs` - Club list
  - `/admin/clubs/[id]` - Club details
  - `/admin/operations` - Operations list
  - `/admin/operations/[clubId]` - Operations detail
  - `/admin/organizations` - Organization list
  - `/admin/organizations/[orgId]` - Organization details
  - `/admin/courts` - Courts list
  - `/admin/users` - Users list
  - `/admin/bookings` - Bookings list
  - And all other admin pages

- **Player Pages**:
  - `/clubs` - Public club list
  - `/clubs/[id]` - Club detail
  - `/courts/[courtId]` - Court detail
  - `/dashboard` - Player dashboard
  - And all other player pages

## Query Parameters

Query parameters are fully preserved. For example:

- Original URL: `/admin/courts?organizationId=123&status=active&page=2`
- After reload: User returns to the exact same URL with all parameters intact

## Benefits

1. **Universal**: Works across all pages without additional code
2. **Automatic**: No need to manually add hooks to each page
3. **Comprehensive**: Preserves both path and query parameters
4. **Safe**: Excludes auth pages to prevent redirect loops
5. **Tested**: Comprehensive test suite ensures reliability

## Migration Notes

No old hooks were found or needed to be removed. The codebase did not have a previous page-preserve mechanism, making this a clean addition without breaking changes.

## Testing

Run the test suite:

```bash
npm test -- page-preserve-provider.test.tsx
```

The tests cover:
- Saving pages to sessionStorage
- Restoring pages on reload
- Preserving query parameters
- Excluding auth pages
- Error handling
- Various page types (clubs, organizations, courts, etc.)
