# Context-Aware Booking Flow

## Overview

The booking flow in ArenaOne is now context-aware, meaning it adapts its step sequence based on where the booking process is initiated. This provides a more streamlined user experience by hiding unnecessary steps and always starting with the most relevant step.

## Behavior

### Operations Page Context (Club Context)

When creating a booking from the **Operations page** (`/admin/operations/[clubId]`):

- **Organization and Club steps are hidden** (automatically preselected)
- **Date & Time step is always shown as the first step**
- User can adjust date/time even when clicking a calendar slot
- Flow: `Date & Time → Court → User → Confirmation`

#### Use Cases

1. **Clicking "New Booking" button**
   - Organization and club are preselected
   - User starts with date/time selection
   
2. **Clicking a calendar slot**
   - Organization, club, date, time, duration, and court are prefilled
   - Date/Time step is still shown (not hidden)
   - User can adjust the time before proceeding
   - Court step is hidden (already selected)

### Bookings Page Context (General Flow)

When creating a booking from the **Bookings page** (`/admin/bookings`):

Steps are shown based on admin role and what's already preselected:

#### Root Admin
- No preselection: `Organization → Club → Date & Time → Court → User → Confirmation`
- After selecting org+club: `Date & Time → Court → User → Confirmation`

#### Organization Admin
- Single club: `Date & Time → Court → User → Confirmation` (org+club preselected)
- Multiple clubs: `Club → Date & Time → Court → User → Confirmation` (org preselected)

#### Club Admin
- `Date & Time → Court → User → Confirmation` (org+club preselected)

## Implementation Details

### Key Change

The `shouldShow` logic for the **dateTime step** (Step 3) was updated in `types.ts`:

```typescript
{
  id: 3,
  label: "dateTime",
  shouldShow: (_, predefinedData) => {
    // Always show date/time step when in club context
    const isClubContext = predefinedData?.organizationId && predefinedData?.clubId;
    if (isClubContext) {
      return true;
    }
    // For general flow, show if any date/time field is missing
    return !predefinedData?.date || !predefinedData?.startTime || !predefinedData?.duration;
  },
}
```

### Step Visibility Logic

Steps are controlled by the `ADMIN_WIZARD_STEPS` configuration in `types.ts`:

1. **Organization (Step 1)**: Shown only for Root Admin when org is not preselected
2. **Club (Step 2)**: Shown for Root/Org Admin when club is not preselected
3. **Date & Time (Step 3)**: Always shown in club context, otherwise shown if date/time incomplete
4. **Court (Step 4)**: Shown when court is not preselected
5. **User (Step 5)**: Shown when user is not preselected
6. **Confirmation (Step 6)**: Always shown

## Testing

Comprehensive test coverage in `booking-flow-context-aware.test.ts`:

- ✅ Operations page context (4 tests)
- ✅ Bookings page context (3 tests)
- ✅ Step visibility rules (2 tests)
- ✅ Edge cases (2 tests)

Run tests:
```bash
npm test src/__tests__/booking-flow-context-aware.test.ts
```

## Benefits

1. **Improved UX**: Users see only relevant steps for their context
2. **Flexibility**: Date/time can still be adjusted even when prefilled from calendar
3. **Consistency**: Same behavior across all admin roles
4. **Backward Compatible**: General booking flow remains unchanged

## Related Files

- `src/components/AdminQuickBookingWizard/types.ts` - Step configuration
- `src/components/AdminQuickBookingWizard/AdminQuickBookingWizard.tsx` - Main wizard component
- `src/app/(pages)/admin/operations/[clubId]/page.tsx` - Operations page
- `src/app/(pages)/admin/bookings/page.tsx` - Bookings page
- `src/__tests__/booking-flow-context-aware.test.ts` - Test suite
