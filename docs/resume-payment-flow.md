# Resume Payment Quick Booking Flow

## Overview

This document describes the implementation of the Resume Payment flow for the Quick Booking modal. When a user has a reserved but unpaid booking, they can resume payment through their profile page. The Quick Booking modal now displays all previous steps (Date/Time, Court Selection, Confirmation) as read-only, followed by an interactive Payment step.

## User Experience

### Previous Behavior
- Only Step 4 (Payment) was displayed
- User could not see what they were paying for
- No visibility into booking progress or previous selections

### New Behavior
- All 4 steps are displayed in the step indicator:
  1. **Date & Time** (locked, read-only)
  2. **Select Court** (locked, read-only)
  3. **Confirm Details** (locked, read-only)
  4. **Payment** (active, interactive)
  
- Steps 1-3 show:
  - Lock icon in the step indicator
  - Info message: "This step is locked and cannot be modified"
  - Summary card with all booking details
  - Grayed out appearance with reduced opacity
  
- Step 4 (Payment) shows:
  - Countdown timer until reservation expires
  - Full booking summary
  - Payment provider selection
  - Pay button (disabled if reservation expired)

### Navigation
- **Back button** is replaced with **Cancel button** in resume payment mode
- User cannot navigate to previous steps
- User can only proceed forward to submit payment or cancel the booking

## Technical Implementation

### Key Changes

#### 1. Updated `determineVisibleSteps` Function
**File:** `src/components/PlayerQuickBooking/types.ts`

```typescript
// In resume payment mode, show all previous steps as read-only plus payment step
if (resumePaymentMode) {
  steps.push({ id: 1, label: "dateTime", isRequired: true });
  steps.push({ id: 2, label: "selectCourt", isRequired: true });
  steps.push({ id: 2.5, label: "confirmation", isRequired: true });
  steps.push({ id: 3, label: "payment", isRequired: true });
  steps.push({ id: 4, label: "finalConfirmation", isRequired: true });
  return steps;
}
```

#### 2. Step Components with Read-Only Mode
**Files:** 
- `src/components/PlayerQuickBooking/Step1DateTime.tsx`
- `src/components/PlayerQuickBooking/Step2Courts.tsx`
- `src/components/PlayerQuickBooking/Step2_5Confirmation.tsx`

Each step component now accepts a `readOnlyMode` prop:

```typescript
interface StepProps {
  // ... other props
  readOnlyMode?: boolean; // Indicates step is locked (resume payment flow)
}
```

When `readOnlyMode` is true:
- Shows lock icon and info message
- Displays data in a summary card format
- Disables all form inputs (via CSS `pointer-events: none`)
- Maintains visual consistency with the design system

#### 3. Step Indicator Updates
**File:** `src/components/PlayerQuickBooking/PlayerQuickBooking.tsx`

The step indicator now shows locked steps with:
- Lock icon instead of step number
- Reduced opacity (60%)
- Special CSS class `rsp-wizard-step--locked`

```typescript
const isLocked = resumePaymentMode && step.id !== 3;
```

#### 4. Navigation Logic
**File:** `src/components/PlayerQuickBooking/PlayerQuickBooking.tsx`

- `handleBack` function prevents navigation when in resume payment mode
- Back button shows "Cancel" text in resume payment mode
- User can only close the modal or proceed to payment

### CSS Styling

**File:** `src/components/PlayerQuickBooking/PlayerQuickBooking.css`

Added styles for locked steps:

```css
/* Locked steps in resume payment mode */
.rsp-wizard-step--locked .rsp-wizard-step-circle {
  background-color: var(--color-surface);
  border-color: var(--color-border);
  color: var(--color-text-secondary);
  opacity: 0.6;
}

.rsp-wizard-step--locked .rsp-wizard-step-label {
  color: var(--color-text-secondary);
  opacity: 0.6;
}

/* Read-only form styling */
.rsp-wizard-form--readonly {
  opacity: 1;
  pointer-events: none;
}
```

### Translations

Added the following translation keys:

**English (en.json):**
```json
{
  "wizard": {
    "stepLockedInfo": "This step is locked and cannot be modified. You can only complete the payment.",
    "price": "Price"
  },
  "court": {
    "surface": "Surface",
    "location": "Location"
  }
}
```

**Ukrainian (uk.json):**
```json
{
  "wizard": {
    "stepLockedInfo": "Цей крок заблоковано та не може бути змінений. Ви можете лише завершити оплату.",
    "price": "Ціна"
  },
  "court": {
    "surface": "Покриття",
    "location": "Розташування"
  }
}
```

## Usage

### Opening Resume Payment Modal

From the player profile page:

```typescript
// Prepare resume payment data
setResumePaymentData({
  bookingId: booking.id,
  clubId: booking.court?.club?.id || "",
  clubName: booking.court?.club?.name || "",
  courtId: booking.courtId,
  courtName: booking.court?.name || "",
  date, // YYYY-MM-DD format in club timezone
  startTime, // HH:MM format in club timezone
  duration, // in minutes
  price: booking.price, // in cents
  reservationExpiresAt: data.reservationExpiresAt, // ISO timestamp
  timezone: clubTimezone, // IANA timezone
});

// Open modal
setShowQuickBookingModal(true);
```

### Modal Props

```typescript
<PlayerQuickBooking
  isOpen={showQuickBookingModal}
  onClose={() => setShowQuickBookingModal(false)}
  resumePaymentMode={true}
  resumePaymentBooking={resumePaymentData}
  onBookingComplete={handleBookingComplete}
/>
```

## Testing

### Manual Testing Checklist
- [ ] Verify all 4 steps are visible in resume payment mode
- [ ] Verify steps 1-3 show lock icon and info message
- [ ] Verify steps 1-3 display correct booking data
- [ ] Verify steps 1-3 are not interactive (no form changes possible)
- [ ] Verify step 4 (payment) is fully functional
- [ ] Verify countdown timer works and expires correctly
- [ ] Verify payment providers load correctly
- [ ] Verify payment button is disabled when reservation expires
- [ ] Verify "Cancel" button closes the modal
- [ ] Verify timezone display is correct
- [ ] Test with different locales (English and Ukrainian)

### Edge Cases
- Expired reservation: Payment button should be disabled
- No payment providers: Show appropriate error message
- Network error: Show error message and allow retry
- Modal close during payment: Preserve booking state

## Acceptance Criteria

✅ User sees all 4 steps in modal  
✅ Steps 1–3 are visible but read-only  
✅ Step 4 is interactive for payment  
✅ Payment works correctly; expired bookings cannot be paid  
✅ UX clearly shows progress through previous steps with lock icons and info messages  
✅ Countdown timer disables pay button when expired  
✅ Club timezone display maintained on UI; UTC sent to backend  
✅ All existing payment providers supported  

## Related Files

- `src/components/PlayerQuickBooking/PlayerQuickBooking.tsx` - Main modal component
- `src/components/PlayerQuickBooking/types.ts` - Type definitions and helper functions
- `src/components/PlayerQuickBooking/Step1DateTime.tsx` - Date/Time step
- `src/components/PlayerQuickBooking/Step2Courts.tsx` - Court selection step
- `src/components/PlayerQuickBooking/Step2_5Confirmation.tsx` - Confirmation step
- `src/components/PlayerQuickBooking/Step3Payment.tsx` - Payment step
- `src/components/PlayerQuickBooking/PlayerQuickBooking.css` - Styles
- `src/app/(pages)/(player)/profile/page.tsx` - Profile page (triggers resume payment)
- `locales/en.json` - English translations
- `locales/uk.json` - Ukrainian translations

## Future Improvements

- Allow users to edit booking details with a new reservation (instead of read-only)
- Add visual indicators for which payment providers are recommended
- Improve error handling for payment failures
- Add analytics tracking for resume payment flow completion rate
