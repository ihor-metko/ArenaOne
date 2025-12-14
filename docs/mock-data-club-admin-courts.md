# Mock Data for Club Admin Courts Page

## Overview

This document describes the mock data infrastructure for the Club Admin Courts page, enabling MVP UI testing without real backend integration.

## Architecture

The mock data system follows these principles:

1. **API Layer Integration**: All mock data is served through the existing API/fetch layer
2. **Store Integration**: Works seamlessly with existing Zustand stores (`useCourtStore`, `useBookingStore`)
3. **Identical Structure**: Mock responses match real API responses exactly
4. **Reactive Updates**: Support for CRUD operations with optimistic updates

## Mock Data Location

- **Source**: `/src/services/mockDb.ts`
- **API Handlers**: `/src/services/mockApiHandlers.ts`
- **API Routes**: Various routes in `/src/app/api/`

## Enabling Mock Mode

Set the environment variable:

```bash
USE_MOCK_DATA=true
```

The system automatically detects this via the `isMockMode()` helper function.

## Mock Data Structure

### Courts

The default club (`6d47229c-280f-475e-bb81-2a0d47d36771` - "Downtown Padel Club") has 3 courts:

- **Court 1**: Indoor, artificial grass, $50.00 default price
- **Court 2**: Indoor, artificial grass, $50.00 default price  
- **Court 3**: Outdoor, synthetic, $40.00 default price

### Bookings

Comprehensive booking data is provided across multiple days:

#### Yesterday
- 2 bookings (1 paid, 1 cancelled)

#### Today
- 8 bookings across 3 courts
- Mix of statuses: paid, reserved, pending
- Includes bookings with and without coaches
- Covers morning (9am), afternoon (2-3pm), and evening (6-8pm) slots

#### Tomorrow
- 4 bookings
- Mix of pending, reserved, and paid statuses

#### Future dates
- Scattered bookings for days 2+ and next week

### Booking Fields

Each booking includes:

```typescript
{
  id: string;              // Unique booking ID
  courtId: string;         // Reference to court
  userId: string;          // Reference to user
  coachId: string | null;  // Optional coach reference
  start: Date;            // Booking start time
  end: Date;              // Booking end time
  price: number;          // Price in cents
  sportType: string;      // Sport type (e.g., "PADEL")
  status: string;         // Booking status
  paymentId: string | null; // Payment reference if paid
  createdAt: Date;        // Creation timestamp
}
```

### Users

Mock users include:
- **user-4** (John Player): Regular player with multiple bookings
- **user-5** (Jane Player): Regular player with multiple bookings
- **coach-1** (Coach Mike Rodriguez): Club coach
- **coach-2** (Coach Sarah Johnson): Club coach

## API Endpoints with Mock Support

### 1. Court Operations Bookings

**Endpoint**: `GET /api/clubs/{clubId}/operations/bookings?date={YYYY-MM-DD}`

**Mock Support**: ✅ Full support

Returns all bookings for a specific club on a given date, including:
- User information (name, email)
- Court information (name)
- Coach information (if applicable)
- Calculated booking status based on time

**Example Response**:
```json
[
  {
    "id": "booking-today-1",
    "userId": "user-4",
    "userName": "John Player",
    "userEmail": "player@example.com",
    "courtId": "court-1",
    "courtName": "Court 1",
    "start": "2024-01-15T09:00:00.000Z",
    "end": "2024-01-15T10:30:00.000Z",
    "status": "paid",
    "price": 6250,
    "sportType": "PADEL",
    "coachId": "coach-1",
    "coachName": "Coach Mike Rodriguez",
    "createdAt": "2024-01-15T08:00:00.000Z"
  }
]
```

### 2. Court Availability

**Endpoint**: `GET /api/clubs/{clubId}/courts/availability?start={YYYY-MM-DD}&days={number}&mode={rolling|calendar}`

**Mock Support**: ✅ Full support

Returns weekly availability showing:
- Hourly time slots (8am-10pm)
- Court-by-court availability status
- Overall slot status summary
- Booking conflict detection

**Availability Statuses**:
- `available`: No bookings in this slot
- `booked`: Fully booked
- `partial`: Partially booked
- `pending`: Pending booking exists

**Example Response**:
```json
{
  "weekStart": "2024-01-15",
  "weekEnd": "2024-01-21",
  "days": [
    {
      "date": "2024-01-15",
      "dayOfWeek": 1,
      "dayName": "Monday",
      "isToday": true,
      "hours": [
        {
          "hour": 9,
          "courts": [
            {
              "courtId": "court-1",
              "courtName": "Court 1",
              "courtType": "padel",
              "indoor": true,
              "status": "booked"
            }
          ],
          "summary": {
            "available": 2,
            "booked": 1,
            "partial": 0,
            "pending": 0,
            "total": 3
          },
          "overallStatus": "partial"
        }
      ]
    }
  ],
  "courts": [...],
  "mode": "rolling"
}
```

### 3. Create Booking

**Endpoint**: `POST /api/admin/bookings/create`

**Mock Support**: ✅ Full support

Creates a new booking with:
- Conflict detection
- Price calculation
- Automatic status assignment
- Store update (reactive)

**Request Body**:
```json
{
  "userId": "user-4",
  "courtId": "court-1",
  "startTime": "2024-01-16T14:00:00.000Z",
  "endTime": "2024-01-16T15:30:00.000Z",
  "clubId": "6d47229c-280f-475e-bb81-2a0d47d36771"
}
```

## Integration with Zustand Stores

### Court Store

The `useCourtStore` provides:
- `fetchCourtsIfNeeded({ clubId })`: Lazy-loads courts for a club
- `courts`: Array of courts
- `loadingCourts`: Loading state
- `courtsError`: Error state

### Booking Store

The `useBookingStore` provides:
- `fetchBookingsForDay(clubId, date)`: Loads bookings for a date
- `createBooking(payload)`: Creates a new booking
- `cancelBooking(bookingId)`: Cancels a booking
- `bookings`: Array of bookings
- `loading`: Loading state
- `error`: Error state

## Usage Example

```typescript
import { useCourtStore } from '@/stores/useCourtStore';
import { useBookingStore } from '@/stores/useBookingStore';

function ClubAdminCourtsPage({ clubId }: { clubId: string }) {
  const courts = useCourtStore(state => state.courts);
  const fetchCourts = useCourtStore(state => state.fetchCourtsIfNeeded);
  
  const bookings = useBookingStore(state => state.bookings);
  const fetchBookings = useBookingStore(state => state.fetchBookingsForDay);
  
  useEffect(() => {
    // These will use mock data when USE_MOCK_DATA=true
    fetchCourts({ clubId });
    fetchBookings(clubId, '2024-01-15');
  }, [clubId]);
  
  // Rest of component logic...
}
```

## Testing

To test the mock data:

1. Set `USE_MOCK_DATA=true` in your environment
2. Navigate to `/admin/clubs/6d47229c-280f-475e-bb81-2a0d47d36771/courts`
3. Verify:
   - Courts list displays correctly
   - Operations calendar shows bookings
   - Availability grid reflects booking conflicts
   - Creating a booking updates the UI reactively

## Data Consistency

The mock data maintains referential integrity:
- All court IDs reference valid courts
- All user IDs reference valid users
- All coach IDs reference valid coaches
- All bookings have valid time ranges
- Status values match the booking status enum

## Future Migration

When switching to real backend:

1. Remove or disable `USE_MOCK_DATA` environment variable
2. No changes needed to components (they already use the API layer)
3. No changes needed to stores (they work with both mock and real data)
4. API routes will automatically use database instead of mock data

The mock data structure is identical to real API responses, ensuring zero breaking changes during migration.

## Maintenance

When adding new features:

1. Add mock data to `mockDb.ts`
2. Update API routes with `isMockMode()` checks
3. Ensure response structure matches real API
4. Update this documentation

## Known Limitations

- Mock data is reset on server restart
- No persistence between sessions
- Limited to predefined scenarios
- No real-time updates between tabs

These limitations are acceptable for MVP development and testing.
