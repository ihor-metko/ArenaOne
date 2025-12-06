# Admin Quick Booking Feature

## Overview

The AdminQuickBooking feature provides a multi-step wizard interface for platform administrators to create bookings on behalf of users. This feature is designed to be flexible and adapt to different admin roles with conditional step rendering based on permissions and predefined data.

## Features

### Multi-Step Wizard Flow

The wizard dynamically adapts its steps based on:
- **Admin Role**: RootAdmin, SuperAdmin (OrgAdmin), or ClubAdmin
- **Predefined Data**: Support for pre-filled values when rescheduling or repeating bookings

#### Steps

1. **Select Organization** (RootAdmin only, skipped if predefined)
   - Allows RootAdmin to choose which organization the booking belongs to
   - Fetches all organizations from `/api/admin/organizations`

2. **Select Club** (RootAdmin and OrgAdmin, skipped for ClubAdmin or if predefined)
   - Filtered by selected organization for RootAdmin
   - Shows only managed clubs for OrgAdmin
   - Fetches clubs from `/api/admin/clubs`

3. **Select/Create User** (All admins, skipped if predefined)
   - Choose from existing users or create a new user inline
   - Users can be created without passwords - they'll set up their account later
   - Fetches users from `/api/admin/users`
   - Creates users via `/api/admin/users/create`

4. **Select Date & Time** (All admins, skipped if predefined)
   - Standard date, time, and duration selection
   - Validates against business hours (9:00 - 22:00)
   - Duration options: 30, 60, 90, 120 minutes

5. **Select Court** (All admins, skipped if predefined)
   - Shows available courts for the selected club and time slot
   - Displays court details (type, surface, indoor/outdoor)
   - Shows resolved pricing based on time-based pricing rules
   - Fetches courts from `/api/clubs/{clubId}/available-courts`

6. **Confirmation** (Always shown)
   - Review all booking details
   - Shows organization, club, user, date/time, court, and total price
   - No payment required - admin bookings are automatically set to "reserved" status

### Role-Based Access Control

The wizard enforces proper access restrictions:

- **RootAdmin**: Access to all organizations and clubs
- **Organization Admin (SuperAdmin)**: Limited to their managed organizations and clubs within
- **Club Admin**: Limited to their assigned clubs only

Access control is enforced both at the UI level (step visibility) and API level (authorization checks).

### API Endpoints

#### Admin Booking Creation
- **POST** `/api/admin/bookings/create`
- Creates a booking with "reserved" status (no payment required)
- Validates admin permissions based on role and managed entities
- Checks for booking conflicts
- Calculates pricing using court price timeline

#### Inline User Creation
- **POST** `/api/admin/users/create`
- Creates a user account without a password
- User can set up their account later via password reset flow
- Returns created user immediately for selection

### Predefined Data Support

The wizard supports predefined data for cancel/reschedule or repeated booking scenarios:

```typescript
interface PredefinedData {
  organizationId?: string;
  clubId?: string;
  userId?: string;
  date?: string;
  startTime?: string;
  duration?: number;
  courtId?: string;
}
```

When predefined data is provided, the corresponding steps are skipped, allowing for a streamlined rebooking experience.

## Usage

### Integration in Admin Pages

```tsx
import { AdminQuickBookingWizard } from "@/components/AdminQuickBookingWizard";

// In your component
const [isWizardOpen, setIsWizardOpen] = useState(false);

// Get admin status
const adminStatus = useAdminStatus(); // Custom hook or API call

<AdminQuickBookingWizard
  isOpen={isWizardOpen}
  onClose={() => setIsWizardOpen(false)}
  onBookingComplete={(bookingId, courtId, date, startTime, endTime) => {
    // Handle booking completion
    console.log("Booking created:", bookingId);
  }}
  adminType={adminStatus.adminType}
  managedIds={adminStatus.managedIds}
  predefinedData={{
    // Optional: pre-fill any fields
    clubId: "some-club-id",
    userId: "some-user-id",
  }}
/>
```

### In Admin Bookings Page

The feature is already integrated into the Admin Bookings page (`/admin/bookings`) with a "Create Booking" button in the page header.

## Technical Details

### Component Structure

```
AdminQuickBookingWizard/
├── AdminQuickBookingWizard.tsx    # Main wizard component
├── AdminQuickBookingWizard.css    # Styles
├── Step1Organization.tsx          # Organization selection
├── Step2Club.tsx                  # Club selection
├── Step3User.tsx                  # User selection/creation
├── Step4DateTime.tsx              # Date and time selection
├── Step5Courts.tsx                # Court selection
├── Step6Confirmation.tsx          # Review and confirm
├── types.ts                       # TypeScript types and utilities
└── index.ts                       # Exports
```

### State Management

The wizard maintains a comprehensive state object that includes:
- Current step
- Selected values for each step
- Available options for dropdowns
- Loading and error states
- Submission state

### Type Safety

All components are fully typed with TypeScript interfaces, ensuring type safety throughout the booking flow.

### Styling

The wizard follows the project's design system:
- Uses `rsp-*` prefixed CSS classes for semantic structure
- Supports dark theme via CSS variables
- Responsive design for mobile and desktop
- Consistent with other platform UI components

## Testing

Comprehensive tests are provided in `src/__tests__/admin-quick-booking-wizard.test.tsx` covering:
- Different admin roles (RootAdmin, OrgAdmin, ClubAdmin)
- Step navigation and conditional rendering
- User selection and inline creation
- Date/time and court selection
- Form validation and error handling

## Future Enhancements

Possible improvements for future iterations:
- Support for coach assignment during booking creation
- Bulk booking creation
- Template bookings for recurring schedules
- Booking notes (requires schema update)
- Email notifications to users about admin-created bookings
- Calendar view for easier date selection
- Multi-court booking support

## Security Considerations

- All API endpoints enforce role-based access control
- Admin permissions are validated on both frontend and backend
- User creation is restricted to admin roles only
- Booking conflicts are prevented at the database level
- Input validation on all user-provided data
