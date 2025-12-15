# ConfirmationModal Component

## Overview

The `ConfirmationModal` is a reusable confirmation dialog component that replaces browser's native `confirm()` dialogs throughout the application. It follows the application's dark theme design system with `im-*` classes and provides a consistent user experience.

## Location

- Component: `/src/components/ui/ConfirmationModal.tsx`
- Styles: `/src/components/ui/ConfirmationModal.css`
- Tests: `/src/__tests__/confirmation-modal.test.tsx`

## Features

- ✅ Fully styled to match the application's dark theme
- ✅ Uses `im-*` semantic classes for consistency
- ✅ Supports custom messages and titles
- ✅ Provides confirm and cancel actions with callbacks
- ✅ Can display dynamic content (e.g., booking details)
- ✅ Supports processing/loading states
- ✅ Two button variants: `danger` (default) and `primary`
- ✅ Keyboard accessible (Escape to close)
- ✅ Fully tested with Jest and React Testing Library

## Usage

### Basic Usage

```tsx
import { ConfirmationModal } from "@/components/ui";

function MyComponent() {
  const [showConfirm, setShowConfirm] = useState(false);
  
  const handleConfirm = () => {
    // Perform action
    console.log("Confirmed!");
    setShowConfirm(false);
  };

  return (
    <>
      <Button onClick={() => setShowConfirm(true)}>
        Delete Item
      </Button>
      
      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        message="Are you sure you want to delete this item?"
      />
    </>
  );
}
```

### Advanced Usage with Custom Content

```tsx
<ConfirmationModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleConfirm}
  title="Cancel Booking"
  message="Are you sure you want to cancel this booking?"
  confirmText="Cancel Booking"
  cancelText="Go Back"
  variant="danger"
  isProcessing={isProcessing}
>
  {/* Optional: Show booking details */}
  <div>
    <p>User: {booking.userName}</p>
    <p>Court: {booking.courtName}</p>
    <p>Time: {formatDateTime(booking.start)}</p>
  </div>
</ConfirmationModal>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isOpen` | `boolean` | Yes | - | Controls modal visibility |
| `onClose` | `() => void` | Yes | - | Callback when modal is closed/cancelled |
| `onConfirm` | `() => void` | Yes | - | Callback when user confirms the action |
| `message` | `string` | Yes | - | The confirmation message to display |
| `title` | `string` | No | `"Confirm Action"` | Modal title |
| `confirmText` | `string` | No | `"Confirm"` | Custom text for confirm button |
| `cancelText` | `string` | No | `"Cancel"` | Custom text for cancel button |
| `variant` | `"danger" \| "primary"` | No | `"danger"` | Button variant for confirm button |
| `isProcessing` | `boolean` | No | `false` | Disables buttons during async operations |
| `children` | `React.ReactNode` | No | - | Optional additional content |

## Translation Keys

The component uses the following translation keys:

- `confirmation.title` - Default modal title
- `confirmation.confirm` - Default confirm button text
- `common.cancel` - Default cancel button text

Add these to your locale files (`locales/en.json`, `locales/uk.json`):

```json
{
  "confirmation": {
    "title": "Confirm Action",
    "confirm": "Confirm"
  },
  "common": {
    "cancel": "Cancel"
  }
}
```

## Styling

The component uses semantic `im-*` classes following the application's design system:

- `im-confirmation-modal` - Main container
- `im-confirmation-modal-message` - Message text
- `im-confirmation-modal-content` - Optional content area
- `im-confirmation-modal-actions` - Button container

All colors and styling automatically adapt to the dark theme using CSS variables.

## Examples in Production

### Admin Bookings - Cancel Booking

The `ConfirmationModal` is currently used in the Admin Bookings page (`/src/components/admin/BookingDetailsModal.tsx`) to confirm booking cancellations. It displays:

- A warning message
- Booking details (user, court, time)
- Cancel and Confirm buttons
- Processing state during API call

### Best Practices

1. **Always set `isProcessing` during async operations** to prevent double-clicks
2. **Use `variant="danger"` for destructive actions** (delete, cancel, etc.)
3. **Use `variant="primary"` for positive confirmations** (save, submit, etc.)
4. **Provide context in the `children` prop** when confirming specific items
5. **Use descriptive button text** instead of generic "Yes/No"

## Testing

Run the test suite:

```bash
npm test confirmation-modal.test.tsx
```

The test suite covers:
- ✅ Modal open/close behavior
- ✅ Custom titles and messages
- ✅ Button click handlers
- ✅ Custom button texts
- ✅ Processing state
- ✅ Children content rendering
- ✅ Button variants

## Migration from Browser `confirm()`

**Before:**
```tsx
const handleDelete = () => {
  if (!confirm("Are you sure?")) return;
  // Delete logic
};
```

**After:**
```tsx
const [showConfirm, setShowConfirm] = useState(false);

const handleDeleteClick = () => {
  setShowConfirm(true);
};

const handleConfirmDelete = () => {
  setShowConfirm(false);
  // Delete logic
};

// In JSX:
<Button onClick={handleDeleteClick}>Delete</Button>

<ConfirmationModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleConfirmDelete}
  message="Are you sure you want to delete this item?"
  variant="danger"
/>
```

## Future Enhancements

Potential improvements for future iterations:

- Add animation transitions
- Support for custom icons
- Multiple action buttons
- Auto-close timer option
- Sound effects or haptic feedback
- Focus trap for accessibility
