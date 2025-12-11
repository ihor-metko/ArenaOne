# Organization Banner Implementation

## Overview
This document describes the implementation of the organization banner feature that reuses the Club Detail banner behavior.

## Changes Made

### 1. New Component: EntityBanner (`src/components/ui/EntityBanner.tsx`)

A reusable, sport-agnostic banner component that can be used for any entity (clubs, organizations, etc.).

**Props:**
- `title` (required): Entity name
- `subtitle` (optional): Short description or tagline
- `location` (optional): Location string with icon
- `imageUrl` (optional): Hero/banner background image
- `logoUrl` (optional): Logo image
- `imageAlt` (optional): Alt text for hero image
- `logoAlt` (optional): Alt text for logo
- `className` (optional): Custom CSS class

**Features:**
- Automatic placeholder generation when no image provided (displays first letter of title)
- Responsive design (mobile to desktop)
- Dark theme support via existing CSS variables
- Accessible (proper alt text, aria-labels)
- Reuses existing `rsp-club-hero` CSS classes from `ClubDetailPage.css`

### 2. Club Detail Page Refactoring

**File:** `src/app/(pages)/(player)/clubs/[id]/page.tsx`

**Changes:**
- Replaced inline hero section (lines 395-434) with `<EntityBanner />` component
- Removed duplicate validation logic (handled by EntityBanner)
- Maintained all existing functionality and visual appearance
- No breaking changes

**Before:**
```tsx
<section className="rsp-club-hero">
  {hasHeroImage ? (
    <>
      <img src={heroImageUrl} alt={`${club.name} hero image`} />
      <div className="rsp-club-hero-overlay" />
    </>
  ) : (
    <div className="rsp-club-hero-placeholder">
      <span className="rsp-club-hero-placeholder-text">
        {club.name.charAt(0).toUpperCase()}
      </span>
    </div>
  )}
  <div className="rsp-club-hero-content">
    {/* logo, title, subtitle, location */}
  </div>
</section>
```

**After:**
```tsx
<EntityBanner
  title={club.name}
  subtitle={club.shortDescription}
  location={locationDisplay}
  imageUrl={heroImageUrl}
  logoUrl={logoUrl}
  imageAlt={`${club.name} hero image`}
  logoAlt={`${club.name} logo`}
/>
```

### 3. Organization Detail Page Enhancement

**File:** `src/app/(pages)/admin/organizations/[orgId]/page.tsx`

**Changes Added:**
- Imported `EntityBanner` component and `ClubDetailPage.css`
- Added banner at the top of the page (before PageHeader)
- Wrapped existing content in `rsp-club-content` container for consistent spacing
- Maps organization data to banner:
  - `title`: Organization name
  - `subtitle`: Organization address (or website if no address)
  - `location`: Organization address (with location icon)
  - `imageUrl`: null (placeholder shown)
  - `logoUrl`: null (no logo shown)

**Visual Result:**
```
┌────────────────────────────────────────────────┐
│                                                │
│               [ O ]  ← Placeholder             │
│                                                │
│         Global Sports Federation               │
│         Leading sports organization            │
│         📍 123 Sports Ave, New York, NY        │
│                                                │
└────────────────────────────────────────────────┘
│ Edit | Reassign Owner | Archive | Delete      │ ← PageHeader actions
├────────────────────────────────────────────────┤
│ Organization Info Card                         │
│ Key Metrics                                    │
│ Clubs Preview                                  │
│ ...                                            │
└────────────────────────────────────────────────┘
```

## Visual Behavior

### Club Detail Page (No Changes)
- ✅ Hero image with overlay (if available)
- ✅ Placeholder with first letter (if no image)
- ✅ Logo display
- ✅ Club name, short description, location
- ✅ Dark theme support
- ✅ Responsive design

### Organization Detail Page (New)
- ✅ Placeholder banner with first letter of organization name
- ✅ Organization name as title
- ✅ Address or website as subtitle
- ✅ Location icon with address (if available)
- ✅ Same visual styling as club banner
- ✅ Dark theme support
- ✅ Responsive design

## Placeholder Behavior

When no `imageUrl` is provided:
1. Gradient background (primary to primary-hover)
2. Large first letter of entity name (uppercase)
3. White text on colored background
4. Same dimensions as image banner

Example for "ArenaOne Organization":
```
┌────────────────────────────────────────────────┐
│                                                │
│                     A                          │
│        (gradient purple background)            │
│                                                │
└────────────────────────────────────────────────┘
```

## Responsive Breakpoints

**Mobile (< 768px):**
- Banner height: 320px
- Title: text-2xl
- Padding: 6px

**Desktop (>= 768px):**
- Banner height: 400px
- Title: text-4xl
- Padding: 8px

## Accessibility Features

1. **Alt Text:**
   - Hero image: `{entityName} hero image` or custom alt text
   - Logo: `{entityName} logo` or custom alt text

2. **ARIA Labels:**
   - Location icon: `aria-hidden="true"` (decorative)
   - Banner container: `data-testid="entity-banner"` for testing

3. **Semantic HTML:**
   - `<section>` for banner container
   - `<h1>` for entity name
   - `<p>` for subtitle and location

## CSS Classes Used

All existing classes from `ClubDetailPage.css`:
- `.rsp-club-hero` - Banner container
- `.rsp-club-hero-image` - Hero background image
- `.rsp-club-hero-overlay` - Dark gradient overlay
- `.rsp-club-hero-placeholder` - Placeholder background
- `.rsp-club-hero-placeholder-text` - Placeholder letter
- `.rsp-club-hero-content` - Content container
- `.rsp-club-hero-logo` - Logo image
- `.rsp-club-hero-name` - Entity name/title
- `.rsp-club-hero-short-desc` - Subtitle
- `.rsp-club-hero-location` - Location with icon

## Testing

### Unit Tests (`src/__tests__/organization-detail-banner.test.tsx`)

**Test Coverage:**
- ✅ Renders banner with organization title
- ✅ Renders placeholder when no image provided
- ✅ Renders with hero image when provided
- ✅ Renders with logo when provided
- ✅ Handles optional subtitle and location
- ✅ Proper alt text for accessibility
- ✅ Correct CSS class structure
- ✅ Custom className support
- ✅ Empty title handling
- ✅ Integration with organization data

**Results:** 16/16 tests passing

### Backward Compatibility
- ✅ Club detail gallery block tests passing (8/8)
- ✅ No regression in existing functionality

## Future Enhancements (Optional)

### 1. Add Image Support to Organizations
```typescript
// Update Organization type in src/types/organization.ts
export interface Organization {
  // ...existing fields
  heroImage?: string | null;
  logo?: string | null;
  shortDescription?: string | null;
}
```

### 2. Action Buttons in Banner
Could add optional action buttons (Edit, Visit Website) directly in banner:
```tsx
<EntityBanner
  title={org.name}
  subtitle={org.address}
  actions={
    <Button onClick={handleEdit}>Edit</Button>
  }
/>
```

### 3. Custom Color Schemes
Support per-organization color schemes for placeholder background.

## Implementation Notes

### Why Reuse `rsp-club-hero` Classes?
1. **Consistency:** Same visual appearance across entity types
2. **No Duplication:** Avoid creating duplicate CSS
3. **Maintainability:** Single source of styling truth
4. **Minimal Changes:** Meets requirement for smallest possible changes

### Why Not Rename CSS Classes?
- Would require updating Club Detail page CSS
- Higher risk of breaking existing functionality
- Not necessary for feature requirement
- Can be done in future refactoring if needed

## Security Considerations

1. **XSS Prevention:** All text content is React-escaped
2. **Image URLs:** Validated via `isValidImageUrl()` utility
3. **Alt Text:** User-controlled but escaped by React
4. **No Direct HTML Injection:** All content rendered via JSX

## Performance Impact

- **Minimal:** Component is lightweight (< 100 lines)
- **No API Changes:** Uses existing data structures
- **No Additional Requests:** No new data fetching
- **Lazy Validation:** Image validation only when needed

## Browser Compatibility

Inherits compatibility from existing club banner:
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Dark mode support across all platforms

## Related Files

**Components:**
- `src/components/ui/EntityBanner.tsx` (new)
- `src/components/ui/index.ts` (modified)

**Pages:**
- `src/app/(pages)/(player)/clubs/[id]/page.tsx` (refactored)
- `src/app/(pages)/admin/organizations/[orgId]/page.tsx` (enhanced)

**Styles:**
- `src/components/ClubDetailPage.css` (reused)
- `src/app/(pages)/admin/organizations/[orgId]/page.css` (existing)

**Tests:**
- `src/__tests__/organization-detail-banner.test.tsx` (new)
- `src/__tests__/club-detail-gallery-block.test.tsx` (verified)

**Utilities:**
- `src/utils/image.ts` (used for validation)

## Summary

✅ **Completed:**
- Reusable EntityBanner component created
- Club Detail page refactored to use new component
- Organization Detail page enhanced with banner
- Comprehensive test coverage (16 tests)
- No linting errors
- Backward compatibility maintained

✅ **Benefits:**
- Code reuse and DRY principle
- Visual consistency across entity types
- Minimal code changes
- Fully tested and accessible
- No breaking changes

⏭️ **Next Steps:**
- Code review
- Security scan (CodeQL)
- Manual QA verification
- User acceptance testing
