# Operations Page Role-Based Club Selection - Implementation Summary

## Overview

Updated the Club Operations page (`/admin/operations`) to implement role-based club selection with proper security validation and UX considerations. The implementation ensures that different admin roles have appropriate access patterns and UI flows.

## Key Changes

### 1. New Component: OperationsClubSelector

**Location**: `src/components/club-operations/OperationsClubSelector.tsx`

A standalone club selector component designed specifically for the Operations page that:
- Doesn't require a list controller (unlike the existing `ClubSelector`)
- Automatically filters clubs based on user role
- Auto-selects when Org Admin has only one club
- Integrates directly with Zustand stores

**Features**:
- Root Admin: Shows all clubs
- Organization Admin: Shows only clubs in their managed organizations
- Club Admin: Shows only their assigned club(s) - disabled state
- Auto-fetches clubs from store on mount
- Validates selected club against filtered list

### 2. Operations Page Updates

**Location**: `src/app/(pages)/admin/operations/page.tsx`

#### Role-Based Initialization Logic

**Club Admin**:
1. Auto-selects their assigned club on mount (fast-path)
2. Immediately fetches club data, courts, and bookings
3. Shows disabled club selector with their club pre-selected
4. URL clubId validation: redirects if URL clubId doesn't match assigned club

**Organization Admin**:
1. Shows club selector without pre-selection
2. Does NOT fetch any data until club is selected
3. Shows instruction text prompting club selection
4. URL clubId validation: defers validation until clubs are loaded, then validates against managed organizations
5. Auto-selects if only one club available

**Root Admin**:
1. Shows club selector without pre-selection
2. Does NOT fetch any data until club is selected
3. URL clubId accepted without validation (has access to all clubs)

#### Data Fetching Pattern

```typescript
// Only fetch when club is selected
useEffect(() => {
  if (selectedClubId) {
    ensureClubById(selectedClubId).catch(console.error);
    fetchCourtsIfNeeded({ clubId: selectedClubId }).catch(console.error);
  }
}, [selectedClubId, ensureClubById, fetchCourtsIfNeeded]);
```

This ensures:
- No premature data fetching for Org/Root admins
- Respects role boundaries
- Improves performance
- Better security (no data exposure before selection)

### 3. Edge Case Handling

#### URL-Based clubId Parameter

The page accepts a `?clubId=xxx` query parameter for deep-linking:

**Club Admin**:
- Validates URL clubId matches their assigned club
- Redirects to correct URL if mismatch detected
- Security: Prevents unauthorized access attempts

**Organization Admin**:
- Validates URL clubId after clubs are loaded
- Ensures clubId belongs to one of their managed organizations
- Redirects to base URL if invalid
- Security: Prevents temporary access to unauthorized clubs

**Root Admin**:
- Accepts any URL clubId immediately (has access to all)

#### Single Club Auto-Selection

When Organization Admin has only one club:
- Automatically selects that club
- Still shows the selector (disabled or with one option)
- Provides clear UX feedback

### 4. Testing

**Location**: `src/__tests__/operations-page-initialization.test.tsx`

Comprehensive test suite with 13 tests covering:

**Access Control**:
- Redirect to sign-in when not logged in
- Redirect to home when not an admin
- Show loading skeleton while loading

**Club Admin Role**:
- Auto-select assigned club
- Show disabled club selector
- Show error when no club assigned

**Organization Admin Role**:
- Show club selector
- No auto-selection
- No premature data fetching

**Root Admin Role**:
- Show club selector
- No auto-selection

**Data Fetching**:
- Only fetch when club selected
- Start polling after club and date selected

### 5. Security Validation

**Server-Side**:
- All API endpoints validate permissions via `requireRole` helpers
- `requireClubAdmin` and `requireOrganizationAdmin` enforce access
- See: `src/app/api/clubs/[id]/operations/bookings/route.ts`

**Client-Side**:
- URL parameter validation before setting state
- Deferred validation for Org Admins (after clubs load)
- Redirects for invalid access attempts
- No trust in client selection - validated server-side

**CodeQL Analysis**: ✅ No security vulnerabilities detected

## Store Integration

### Zustand Stores Used

1. **useUserStore**: User authentication, roles, admin status
2. **useClubStore**: Club data, `ensureClubById`, `fetchClubsIfNeeded`
3. **useCourtStore**: Court data, `fetchCourtsIfNeeded`
4. **useBookingStore**: Booking data, `fetchBookingsForDay`, polling

### Data Flow

```
User Authentication (useUserStore)
  ↓
Role Detection (adminStatus.adminType)
  ↓
Club Selection (OperationsClubSelector)
  ↓
Store Methods (fetchClubsIfNeeded, ensureClubById)
  ↓
Data Fetching (fetchCourtsIfNeeded, fetchBookingsForDay)
  ↓
UI Rendering (DayCalendar, TodayBookingsList)
```

## UI/UX Improvements

### Before Club Selection (Org/Root Admin)
- Clear instruction text: "Please select a club to view its operations."
- Prominent club selector
- No calendar or booking list shown (skeleton or empty state)

### After Club Selection
- PageHeader shows club name
- Club selector remains visible (disabled for Club Admin)
- Calendar and booking list render with data
- Auto-refresh polling starts (15s interval)

### Styling
- CSS updates in `page.css`:
  - `.im-club-operations-instruction` for helper text
  - Flex column layout for club selector section
  - Dark theme support

## Files Changed

1. ✅ `src/components/club-operations/OperationsClubSelector.tsx` (new)
2. ✅ `src/components/club-operations/index.ts` (export added)
3. ✅ `src/app/(pages)/admin/operations/page.tsx` (updated)
4. ✅ `src/app/(pages)/admin/operations/page.css` (updated)
5. ✅ `src/__tests__/operations-page-initialization.test.tsx` (new)

## Acceptance Criteria Status

- ✅ Club Admin users see operations immediately for their assigned club
- ✅ Organization Admin users see club selector first; no data fetched until selection
- ✅ No duplicate API calls; store used as single source of truth
- ✅ Server-side permission checks enforced; client doesn't bypass them
- ✅ URL-based clubId supported with validation
- ✅ Single club auto-selection for Org Admin
- ✅ Comprehensive test coverage
- ✅ Security validation (CodeQL clean)

## Future Considerations

### For Similar Admin Features

When implementing similar role-based resource selection:

1. **Create a standalone selector component** specific to the feature
   - Don't force-fit list controller pattern if not needed
   - Filter resources based on user role in the component

2. **Defer data fetching until resource is selected**
   - Prevents premature API calls
   - Respects role boundaries
   - Better performance

3. **Validate URL parameters** against user permissions
   - Club Admin: strict validation (only their assigned resources)
   - Org Admin: validate after resources load
   - Root Admin: accept any (but still validate server-side)

4. **Use existing stores** for data management
   - Don't duplicate fetch logic
   - Use `fetch*IfNeeded` methods
   - Implement request guards to prevent duplicate calls

5. **Test role-based initialization thoroughly**
   - Cover all admin types
   - Test data fetching guards
   - Test URL parameter validation

## Troubleshooting

### Issue: Org Admin sees no clubs in selector

**Cause**: Clubs not loaded yet or user has no managed organizations

**Solution**: Check `useClubStore` state, ensure `fetchClubsIfNeeded` completed

### Issue: Club Admin can't see calendar

**Cause**: Auto-selection failed or assigned club missing

**Solution**: Check `adminStatus.assignedClub` exists and is valid

### Issue: Data not loading after club selection

**Cause**: useEffect dependencies or API errors

**Solution**: Check browser console for API errors, verify `selectedClubId` is set

## References

- Issue: Update Operations page to use current clubId & show club selector for Org Admin
- PR: `copilot/update-club-operations-page`
- Copilot Settings: `.github/copilot-settings.md`
- API Endpoint: `src/app/api/clubs/[id]/operations/bookings/route.ts`
- User Store: `src/stores/useUserStore.ts`
- Club Store: `src/stores/useClubStore.ts`
