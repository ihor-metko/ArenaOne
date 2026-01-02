# Club Detail Banner - Full Address Display

## Summary of Changes

This change updates the Club Detail Page banner to display the **full address** from the `location` field instead of the shorter `city, country` format.

## Files Modified

### 1. `/src/app/(pages)/(player)/clubs/[id]/page.tsx`
- **Before**: Used `locationDisplay` which prioritized `city, country` format
  ```typescript
  const locationDisplay = [club.city, club.country].filter(Boolean).join(", ") || club.location;
  ```
  Then passed to banner:
  ```typescript
  <EntityBanner location={locationDisplay} ... />
  ```

- **After**: Directly uses `club.location` (full address)
  ```typescript
  <EntityBanner location={club.location || undefined} ... />
  ```

### 2. API Routes (Bug Fixes)
Fixed TypeScript build errors in multiple API routes by removing invalid `metadata: false` from Prisma queries:
- `/src/app/api/(player)/clubs/[id]/route.ts`
- `/src/app/api/(player)/clubs/route.ts`
- `/src/app/api/admin/clubs/[id]/route.ts`
- `/src/app/api/admin/clubs/route.ts`
- `/src/app/api/admin/organizations/[id]/clubs/route.ts`

## Testing

### New Test
Created `/src/__tests__/club-detail-banner-full-address.test.tsx` to verify:
- ✅ Banner displays full address from `location` field
- ✅ Banner does NOT use the short `city, country` format

### Existing Tests
All related tests continue to pass:
- ✅ `club-detail-banner-full-address.test.tsx` (new)
- ✅ `club-detail-refactor.test.ts`
- ✅ `club-detail-gallery-block.test.tsx`
- ✅ `organization-detail-banner.test.tsx` (36 tests)

## Example

### Before:
If a club has:
- `location`: "123 Main Street, Downtown, Springfield, IL 62701"
- `city`: "Springfield"
- `country`: "USA"

Banner displayed: **"Springfield, USA"**

### After:
Banner displays: **"123 Main Street, Downtown, Springfield, IL 62701"**

## Graceful Handling

The `EntityBanner` component already handles missing addresses gracefully with conditional rendering:
```typescript
{location && (
  <p className="rsp-club-hero-location">
    <LocationIcon />
    {location}
  </p>
)}
```

If `location` is null, undefined, or empty string, the location element is not rendered.

## Responsiveness

No CSS changes were needed. The existing banner styles already handle long addresses responsively:
- Text wraps naturally on smaller screens
- Uses semantic `im-*` classes that support the dark theme
- Maintains all other banner elements (logo, name, subtitle)

## Build Status

✅ TypeScript compilation successful
✅ ESLint checks passed (warnings only in test files)
✅ Production build completed successfully
