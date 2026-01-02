# Banner Styles Extraction - Documentation

## Overview

This document describes the extraction and centralization of banner styles for the `EntityBanner` component to ensure consistent rendering across all entity detail pages (Organization, Club, and Court).

## Problem Statement

Previously, banner-related CSS styles were scattered across multiple files, primarily in `ClubDetailPage.css`. When the `EntityBanner` component was reused on other pages like Court Details, the styles were not available, causing the banner to lose its visual appearance.

## Solution

### 1. Created Dedicated Stylesheet

Created a new file: `src/components/ui/EntityBanner.styles.css`

This file now contains all banner-related styles:
- Hero section layout and sizing
- Background image handling
- Placeholder styles when no image is provided
- Overlay gradient effects
- Content positioning and layout
- Status badge styles (published, draft, archived, active, inactive)
- Edit button styles
- Actions container styles
- Text element styles (title, subtitle, location)

### 2. Updated EntityBanner Component

Modified `src/components/ui/EntityBanner.tsx` to import the dedicated stylesheet:

```typescript
import "./EntityBanner.styles.css";
```

### 3. Cleaned Up Duplicate Styles

Removed duplicate banner styles from:
- `src/components/ClubDetailPage.css` - Removed all `.rsp-club-hero*` and `.rsp-entity-banner*` classes

## CSS Class Naming Convention

All banner styles use the `rsp-*` prefix (consistent with the existing convention):

### Core Classes
- `.rsp-club-hero` - Main banner container
- `.rsp-club-hero-image` - Background image
- `.rsp-club-hero-overlay` - Dark gradient overlay
- `.rsp-club-hero-placeholder` - Placeholder when no image
- `.rsp-club-hero-content` - Content container

### Text Elements
- `.rsp-club-hero-name` - Entity title
- `.rsp-club-hero-short-desc` - Subtitle/description
- `.rsp-club-hero-location` - Location text with icon

### Status Badges
- `.rsp-entity-status-badge` - Base badge class
- `.rsp-entity-status-badge--published` - Published state
- `.rsp-entity-status-badge--draft` - Unpublished/draft state
- `.rsp-entity-status-badge--archived` - Archived state
- `.rsp-entity-status-badge--active` - Active state
- `.rsp-entity-status-badge--inactive` - Inactive state

### Interactive Elements
- `.rsp-entity-banner-actions` - Top-right actions container
- `.rsp-entity-banner-edit-btn` - Edit button
- `.rsp-entity-banner-edit-btn--disabled` - Disabled edit button

## Usage Across Pages

### Organization Details Page
File: `src/app/(pages)/admin/organizations/[orgId]/page.tsx`

Already imports `@/components/ClubDetailPage.css` which contained the original styles. Now works through the EntityBanner component's own stylesheet.

```tsx
<EntityBanner
  title={org.name}
  subtitle={org.description}
  location={formatAddress(org.address)}
  imageUrl={org.bannerData?.url}
  bannerAlignment={orgBannerAlignment}
  logoUrl={org.logoData?.url}
  logoMetadata={orgLogoMetadata}
  isPublished={org.isPublic}
  isArchived={!!org.archivedAt}
  onEdit={handleOpenDetailsEdit}
/>
```

### Club Details Page
File: `src/app/(pages)/admin/clubs/[id]/page.tsx`

Already imports `@/components/ClubDetailPage.css` which contained the original styles. Now works through the EntityBanner component's own stylesheet.

```tsx
<EntityBanner
  title={club.name}
  subtitle={club.shortDescription}
  location={club.address?.formattedAddress}
  imageUrl={club.bannerData?.url}
  bannerAlignment={clubBannerAlignment}
  logoUrl={club.logoData?.url}
  logoMetadata={clubLogoMetadata}
  isPublished={club.isPublic}
  onEdit={handleOpenDetailsEdit}
/>
```

### Court Details Page
File: `src/app/(pages)/admin/courts/[courtId]/page.tsx`

**Previously broken** - Did not import `ClubDetailPage.css`, so banner had no styles.
**Now fixed** - Styles come directly from EntityBanner component.

```tsx
<EntityBanner
  title={court.name}
  subtitle={court.type || (court.indoor ? "Indoor Court" : "Outdoor Court")}
  imageUrl={court.bannerData?.url}
  bannerAlignment={courtMetadata?.bannerAlignment || 'center'}
  onEdit={handleOpenDetailsEdit}
/>
```

## Testing

### Existing Tests
- `src/__tests__/organization-detail-banner.test.tsx` - 36 tests (all passing)
  - Banner rendering
  - Accessibility
  - Visual variants
  - Logo theme handling
  - Status badges
  - Admin features

### New Tests
- `src/__tests__/entity-banner-styles-reusability.test.tsx` - 21 tests (all passing)
  - Style class consistency
  - Status badge styles
  - Edit button styles
  - Actions container styles
  - Banner alignment support
  - Simulated page contexts (Organization, Club, Court)
  - CSS naming convention

**Total: 57 tests passing**

## Benefits

1. **Single Source of Truth**: All banner styles are now in one place (`EntityBanner.styles.css`)
2. **Component Encapsulation**: Styles are imported by the component itself, not by consuming pages
3. **Reusability**: Banner renders consistently across all pages (Organization, Club, Court)
4. **No Style Loss**: Styles are no longer lost when the component is reused
5. **Maintainability**: Future banner style changes only need to be made in one file
6. **Decoupling**: Pages no longer need to import `ClubDetailPage.css` to use the banner

## Migration Notes

### Pages That Previously Imported ClubDetailPage.css

These pages still import `ClubDetailPage.css` for other club-specific styles, but the banner styles now come from `EntityBanner.styles.css`:
- Organization Details page
- Club Details page

### Pages That Previously Had No Banner Styles

These pages now automatically get banner styles through the EntityBanner component:
- Court Details page (previously broken)

### No Breaking Changes

- All existing class names preserved
- Component API unchanged
- Existing pages continue to work without modification
- Tests continue to pass

## Future Enhancements

Potential improvements for future iterations:

1. Consider migrating to `im-*` prefix for consistency with newer components
2. Add CSS variables for theming (colors, spacing, sizing)
3. Consider CSS modules or CSS-in-JS for better encapsulation
4. Add responsive design tokens for breakpoints
5. Document banner alignment best practices

## File Changes Summary

### Created
- `src/components/ui/EntityBanner.styles.css` (250 lines)
- `src/__tests__/entity-banner-styles-reusability.test.tsx` (386 lines)

### Modified
- `src/components/ui/EntityBanner.tsx` (added import statement)
- `src/components/ClubDetailPage.css` (removed 131 lines of duplicate styles)

### Total
- +636 lines added
- -131 lines removed
- Net: +505 lines (mostly tests and documentation comments)
