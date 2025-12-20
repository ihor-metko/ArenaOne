# WebSocket Client Setup for Real-Time Bookings

## Overview

The ArenaOne platform uses Socket.IO to provide real-time updates for bookings. The WebSocket client is fully integrated into the React/Next.js frontend and can be easily used by any component that needs to receive live updates.

## Architecture

### Server-Side
- **Server**: Custom Next.js server with Socket.IO (`server.js`)
- **Socket Types**: Typed events defined in `@/types/socket`
- **Emitters**: Helper functions in `@/lib/socketEmitters` for emitting events from API routes

### Client-Side
- **Hook**: `useSocketIO` hook in `@/hooks/useSocketIO`
- **Library**: `socket.io-client@4.8.1`
- **Connection**: Singleton pattern with automatic cleanup

## Usage

### Basic Usage

Import the hook from `@/hooks`:

```tsx
import { useSocketIO } from '@/hooks';

function MyBookingComponent() {
  const { socket, isConnected } = useSocketIO({
    autoConnect: true,
    onBookingCreated: (data) => {
      console.log('New booking created:', data);
      // Refresh bookings or update UI
    },
    onBookingUpdated: (data) => {
      console.log('Booking updated:', data);
      // Update booking in UI
    },
    onBookingDeleted: (data) => {
      console.log('Booking deleted:', data);
      // Remove booking from UI
    },
  });

  return (
    <div>
      <p>WebSocket Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      {/* Your booking UI */}
    </div>
  );
}
```

### Manual Connection Control

```tsx
import { useSocketIO } from '@/hooks';

function MyComponent() {
  const { socket, isConnected, connect, disconnect } = useSocketIO({
    autoConnect: false, // Don't connect automatically
  });

  const handleConnect = () => {
    connect();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <div>
      <button onClick={handleConnect} disabled={isConnected}>
        Connect
      </button>
      <button onClick={handleDisconnect} disabled={!isConnected}>
        Disconnect
      </button>
    </div>
  );
}
```

### Integration with Zustand Store

The recommended pattern is to integrate WebSocket events with the `useBookingStore`:

```tsx
import { useEffect } from 'react';
import { useSocketIO } from '@/hooks';
import { useBookingStore } from '@/stores/useBookingStore';

function BookingsList({ clubId, date }: { clubId: string; date: string }) {
  const bookings = useBookingStore(state => state.bookings);
  const fetchBookingsForDay = useBookingStore(state => state.fetchBookingsForDay);
  const invalidateBookings = useBookingStore(state => state.invalidateBookings);

  // Set up WebSocket connection
  const { isConnected } = useSocketIO({
    autoConnect: true,
    onBookingCreated: (data) => {
      // Only refresh if the event is for the current club
      if (data.clubId === clubId) {
        invalidateBookings();
        fetchBookingsForDay(clubId, date);
      }
    },
    onBookingUpdated: (data) => {
      if (data.clubId === clubId) {
        invalidateBookings();
        fetchBookingsForDay(clubId, date);
      }
    },
    onBookingDeleted: (data) => {
      if (data.clubId === clubId) {
        invalidateBookings();
        fetchBookingsForDay(clubId, date);
      }
    },
  });

  // Initial fetch
  useEffect(() => {
    fetchBookingsForDay(clubId, date);
  }, [clubId, date, fetchBookingsForDay]);

  return (
    <div>
      <div>Connection: {isConnected ? '🟢 Live' : '🔴 Offline'}</div>
      {/* Render bookings */}
    </div>
  );
}
```

## Event Types

### `bookingCreated`

Emitted when a new booking is created.

```typescript
interface BookingCreatedEvent {
  booking: OperationsBooking;
  clubId: string;
  courtId: string;
}
```

### `bookingUpdated`

Emitted when a booking is updated (e.g., status change, time change).

```typescript
interface BookingUpdatedEvent {
  booking: OperationsBooking;
  clubId: string;
  courtId: string;
  previousStatus?: string;
}
```

### `bookingDeleted`

Emitted when a booking is deleted or cancelled.

```typescript
interface BookingDeletedEvent {
  bookingId: string;
  clubId: string;
  courtId: string;
}
```

## Hook API

### `useSocketIO(options?: UseSocketIOOptions): UseSocketIOReturn`

#### Options

```typescript
interface UseSocketIOOptions {
  /**
   * Whether to automatically connect on mount
   * @default true
   */
  autoConnect?: boolean;

  /**
   * Callback when a booking is created
   */
  onBookingCreated?: (data: BookingCreatedEvent) => void;

  /**
   * Callback when a booking is updated
   */
  onBookingUpdated?: (data: BookingUpdatedEvent) => void;

  /**
   * Callback when a booking is deleted
   */
  onBookingDeleted?: (data: BookingDeletedEvent) => void;
}
```

#### Return Value

```typescript
interface UseSocketIOReturn {
  /**
   * Socket.IO client instance
   */
  socket: TypedSocket | null;

  /**
   * Whether the socket is connected
   */
  isConnected: boolean;

  /**
   * Manually connect the socket
   */
  connect: () => void;

  /**
   * Manually disconnect the socket
   */
  disconnect: () => void;
}
```

## Connection Lifecycle

The hook automatically manages the connection lifecycle:

1. **On Mount** (if `autoConnect: true`):
   - Creates Socket.IO client
   - Connects to server
   - Registers event listeners
   - Logs: `Socket.IO connected: <socket-id>`

2. **On Disconnect**:
   - Updates `isConnected` state
   - Logs: `Socket.IO disconnected`

3. **On Error**:
   - Logs connection errors
   - Console: `Socket.IO connection error: <error-message>`

4. **On Unmount**:
   - Removes all event listeners
   - Disconnects socket
   - Cleans up resources

## Server-Side Emitting

To emit events from API routes, use the helper functions in `@/lib/socketEmitters`:

```typescript
import { emitBookingCreated, emitBookingUpdated, emitBookingDeleted } from '@/lib/socketEmitters';

// After creating a booking
emitBookingCreated({
  booking: newBooking,
  clubId: booking.clubId,
  courtId: booking.courtId,
});

// After updating a booking
emitBookingUpdated({
  booking: updatedBooking,
  clubId: booking.clubId,
  courtId: booking.courtId,
  previousStatus: 'confirmed',
});

// After deleting a booking
emitBookingDeleted({
  bookingId: booking.id,
  clubId: booking.clubId,
  courtId: booking.courtId,
});
```

## Testing

Tests are available in `src/__tests__/useSocketIO.test.ts`. Run with:

```bash
npm test useSocketIO
```

## Troubleshooting

### Connection Not Establishing

1. Ensure you're running the app with the custom server:
   ```bash
   npm run dev  # Uses server.js
   ```
   NOT:
   ```bash
   npm run dev:next  # Doesn't include Socket.IO server
   ```

2. Check that Socket.IO server is initialized:
   ```
   > Socket.IO server initialized
   ```

3. Verify the endpoint is accessible:
   ```bash
   curl http://localhost:3000/api/socket
   ```

### Events Not Received

1. Check that callbacks are properly defined
2. Verify the event is being emitted server-side (check console logs)
3. Ensure the socket is connected (`isConnected === true`)

### Multiple Connections

The hook uses a singleton pattern with cleanup on unmount. If you're seeing multiple connections:
- Ensure you're not calling the hook multiple times at the root level
- Check that components using the hook are properly unmounting

## Best Practices

1. **Use with Zustand stores**: Integrate WebSocket events with your existing stores for consistent state management
2. **Filter events by context**: Only refresh data if the event is relevant to the current view (check `clubId`, `courtId`, etc.)
3. **Handle disconnections gracefully**: Show connection status to users and fall back to polling if needed
4. **Don't over-fetch**: Use the invalidation pattern to trigger controlled refetches rather than fetching on every event
5. **Clean up properly**: Let the hook manage the lifecycle; don't manually disconnect unless needed

## Related Files

- Hook: `src/hooks/useSocketIO.ts`
- Types: `src/types/socket.ts`
- Server: `server.js`
- Emitters: `src/lib/socketEmitters.ts`
- Tests: `src/__tests__/useSocketIO.test.ts`
- Booking Store: `src/stores/useBookingStore.ts`
