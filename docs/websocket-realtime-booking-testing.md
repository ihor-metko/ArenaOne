# WebSocket Real-time Booking Updates - Testing Guide

This document provides guidance on testing WebSocket-based real-time booking updates, both automated and manual.

## Overview

The ArenaOne platform uses WebSocket (Socket.IO) to provide real-time updates for bookings across all connected clients. When a booking is created, updated, or deleted, all connected clients receive instant notifications and their UI updates automatically.

## Automated Tests

### Location
- **Primary test file**: `src/__tests__/websocket-realtime-booking-updates.test.tsx`
- **Supporting tests**: 
  - `src/__tests__/useSocketIO.test.ts` - Hook unit tests
  - `src/__tests__/today-bookings-list-socketio.test.tsx` - Component integration tests
  - `src/__tests__/bookings-overview-socketio.test.tsx` - Component integration tests

### Running Automated Tests

```bash
# Run all WebSocket tests
npm test -- --testPathPatterns="websocket|socket"

# Run just the comprehensive real-time updates tests
npm test -- --testPathPatterns="websocket-realtime-booking-updates"

# Run with verbose output
npm test -- --testPathPatterns="websocket-realtime-booking-updates" --verbose
```

### Test Coverage

The automated test suite covers:

1. **Multi-client Connections**
   - Multiple clients connecting simultaneously
   - Event handler registration for all clients
   - Unique socket IDs per client

2. **Booking Created Events**
   - All clients receive notification
   - UI state updates correctly
   - No duplication of bookings

3. **Booking Updated Events**
   - All clients receive update
   - Existing bookings are updated in place
   - Status changes are reflected correctly

4. **Booking Deleted Events**
   - All clients are notified
   - Bookings are removed from UI
   - Other bookings remain unaffected

5. **Edge Cases**
   - **Reconnection**: Clients can disconnect and reconnect without issues
   - **Rapid events**: Debouncing prevents UI flickering from rapid updates
   - **Conflict resolution**: Timestamp-based conflict detection prevents outdated updates
   - **No duplication**: Same event received multiple times doesn't create duplicates

## Manual Testing

### Setup for Manual Testing

1. **Start the development server with WebSocket support**:
   ```bash
   npm run dev
   ```
   This starts Next.js with the custom server (`server.js`) that includes Socket.IO.

2. **Open multiple browser tabs/windows**:
   - Open 3-4 browser tabs or windows
   - Navigate to a page that displays bookings (e.g., admin operations page)
   - Ensure all tabs are viewing the same club's bookings

### Manual Test Scenarios

#### Scenario 1: Verify Multi-Client Updates

**Objective**: Confirm that all connected clients see booking updates in real-time.

**Steps**:
1. Open 3 browser tabs to the same club operations page
2. In tab 1, create a new booking
3. **Verify**: All 3 tabs show the new booking within 1-2 seconds
4. In tab 2, update the booking (e.g., change status to "Cancelled")
5. **Verify**: All 3 tabs reflect the updated status
6. In tab 3, delete the booking
7. **Verify**: All 3 tabs no longer show the deleted booking

**Expected Results**:
- ✅ New bookings appear in all tabs automatically
- ✅ Updates are reflected across all tabs
- ✅ Deletions remove the booking from all tabs
- ✅ No page refresh required
- ✅ UI updates smoothly without flickering

#### Scenario 2: Test Reconnection

**Objective**: Verify that clients can reconnect and resync data after network issues.

**Steps**:
1. Open browser tab to club operations page
2. Open browser DevTools → Network tab
3. Toggle "Offline" mode to simulate network loss
4. **Verify**: WebSocket status indicator shows "Disconnected" or "Offline"
5. Toggle "Online" mode to restore network
6. **Verify**: WebSocket reconnects automatically
7. Create a booking in another tab
8. **Verify**: The reconnected tab receives the update

**Expected Results**:
- ✅ Client detects disconnection
- ✅ Client automatically reconnects when network is restored
- ✅ After reconnection, client receives all missed updates
- ✅ No errors in browser console

#### Scenario 3: Test Rapid Updates

**Objective**: Verify that rapid consecutive updates don't cause UI flickering or performance issues.

**Steps**:
1. Open browser tab to club operations page
2. Using an API client (Postman/curl) or another browser tab, rapidly create/update 10 bookings within 5 seconds
3. **Observe** the UI in the first tab

**Expected Results**:
- ✅ UI remains smooth and responsive
- ✅ No visible flickering or jumping
- ✅ All final booking states are correctly displayed
- ✅ No duplicate bookings appear
- ✅ Browser remains responsive (no freezing)

#### Scenario 4: Test Timestamp Conflict Resolution

**Objective**: Verify that outdated updates are ignored in favor of newer data.

**Steps**:
1. Open browser tab to club operations page with a booking visible
2. Note the current status of a booking
3. Using browser DevTools Console, manually trigger an update with an older timestamp:
   ```javascript
   // Assuming the booking's current updatedAt is "2024-01-15T12:00:00Z"
   // Try to apply an update with an older timestamp
   const socket = window.io(); // Access socket from window if exposed
   socket.emit('bookingUpdated', {
     booking: {
       id: 'booking-id',
       // ... other fields
       bookingStatus: 'Cancelled',
       updatedAt: '2024-01-15T11:00:00Z' // Older than current
     },
     clubId: 'club-id',
     courtId: 'court-id',
     previousStatus: 'Active'
   });
   ```
4. **Verify**: The booking status does NOT change (older update is ignored)

**Expected Results**:
- ✅ Older updates are ignored
- ✅ Current state is preserved
- ✅ Console shows conflict detection message (in development mode)

### Manual Testing Checklist

Use this checklist when performing manual testing:

- [ ] Multiple tabs receive updates simultaneously
- [ ] Create booking event updates all clients
- [ ] Update booking event updates all clients
- [ ] Delete booking event updates all clients
- [ ] Connection status indicator shows correct state
- [ ] Reconnection works after network interruption
- [ ] Rapid updates don't cause flickering
- [ ] No duplicate bookings appear
- [ ] Timestamp-based conflict resolution works
- [ ] No errors in browser console
- [ ] Page remains responsive under load
- [ ] Toast notifications appear for updates (if enabled)

## Debugging WebSocket Issues

### Enable WebSocket Logging

WebSocket events are logged to the browser console in development mode:

```javascript
// In browser console, you'll see:
// "Socket.IO connected: <socket-id>"
// "Socket.IO disconnected"
// "Socket.IO reconnected after N attempts"
// "[Socket Update Conflict]" - when outdated update is ignored
```

### Common Issues and Solutions

1. **Events not received**
   - Check that Socket.IO server is running (`npm run dev`)
   - Verify WebSocket connection in Network tab (look for `socket.io` requests)
   - Check browser console for connection errors

2. **UI not updating**
   - Verify event handlers are registered (check component code)
   - Check that clubId matches between event and current view
   - Inspect Zustand store state in React DevTools

3. **Duplicate bookings**
   - Check that `updateBookingFromSocket` is using conflict resolution
   - Verify booking IDs are unique
   - Check for multiple event handler registrations

4. **Performance issues**
   - Increase debounce delay if updates are too frequent
   - Check that old event handlers are cleaned up on unmount
   - Monitor memory usage in browser DevTools

## Example Usage in Components

### Basic WebSocket Integration

```tsx
import { useSocketIO } from '@/hooks/useSocketIO';
import { useBookingStore } from '@/stores/useBookingStore';

function BookingsList({ clubId }: { clubId: string }) {
  const bookings = useBookingStore(state => state.bookings);
  const fetchBookings = useBookingStore(state => state.fetchBookingsForDay);
  const updateBooking = useBookingStore(state => state.updateBookingFromSocket);
  const removeBooking = useBookingStore(state => state.removeBookingFromSocket);

  // Set up WebSocket connection
  const { isConnected } = useSocketIO({
    autoConnect: true,
    onBookingCreated: (data) => {
      if (data.clubId === clubId) {
        updateBooking(data.booking);
      }
    },
    onBookingUpdated: (data) => {
      if (data.clubId === clubId) {
        updateBooking(data.booking);
      }
    },
    onBookingDeleted: (data) => {
      if (data.clubId === clubId) {
        removeBooking(data.bookingId);
      }
    },
    onReconnect: () => {
      // Resync data after reconnection
      fetchBookings(clubId, new Date().toISOString().split('T')[0]);
    },
  });

  return (
    <div>
      {isConnected && <div>🟢 Live updates enabled</div>}
      {/* Render bookings */}
    </div>
  );
}
```

### Testing WebSocket in Storybook

If you use Storybook, you can create stories that simulate WebSocket events:

```tsx
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { BookingsList } from './BookingsList';

export default {
  title: 'Components/BookingsList',
  component: BookingsList,
} as ComponentMeta<typeof BookingsList>;

const Template: ComponentStory<typeof BookingsList> = (args) => (
  <BookingsList {...args} />
);

export const WithRealtimeUpdates = Template.bind({});
WithRealtimeUpdates.args = {
  clubId: 'club-1',
};
```

## Performance Benchmarks

Expected performance metrics:

- **Event latency**: < 100ms from server emit to client receive
- **UI update latency**: < 300ms from event receive to UI render (includes debounce)
- **Memory per connection**: < 1MB
- **Max concurrent clients tested**: 100+ clients
- **Events per second**: Can handle 50+ events/second with debouncing

## Continuous Integration

WebSocket tests are included in the CI pipeline:

```bash
# In CI, tests run with:
npm test -- --ci --maxWorkers=2
```

All WebSocket tests must pass before merging to main branch.

## Additional Resources

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [React Testing Library](https://testing-library.com/react)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- Project-specific WebSocket hook: `src/hooks/useSocketIO.ts`
- Socket event types: `src/types/socket.ts`
