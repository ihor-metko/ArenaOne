# WebSocket Examples

This directory contains example components demonstrating how to use the WebSocket client (`useSocketIO` hook) for real-time updates in ArenaOne.

## Available Examples

### 1. BookingListWithWebSocket

A complete example showing how to integrate WebSocket events with the booking store for real-time updates.

**Features:**
- Connection status indicator
- Real-time booking updates (create, update, delete)
- Integration with `useBookingStore`
- Last update notification
- Automatic refetching on events

**Usage:**
```tsx
import { BookingListWithWebSocket } from '@/components/examples/BookingListWithWebSocket';

export default function MyBookingsPage() {
  return (
    <BookingListWithWebSocket 
      clubId="club-123" 
      date="2024-01-15" 
    />
  );
}
```

### 2. WebSocketStatusIndicator

A minimal status indicator component that shows WebSocket connection status.

**Usage:**
```tsx
import { WebSocketStatusIndicator } from '@/components/examples/BookingListWithWebSocket';

export default function MyComponent() {
  return (
    <div>
      <h1>My Page <WebSocketStatusIndicator /></h1>
      {/* Rest of your content */}
    </div>
  );
}
```

## How to Use These Examples

1. **Copy and adapt**: These are demonstration components. Copy the relevant parts to your own components.

2. **Learn the patterns**: Study how the `useSocketIO` hook is used with event handlers and the Zustand store.

3. **Customize**: Modify the UI and logic to fit your specific needs.

## Key Patterns

### Pattern 1: Auto-connect with Event Handlers

```tsx
const { isConnected } = useSocketIO({
  autoConnect: true,
  onBookingCreated: (data) => {
    // Handle new booking
    if (data.clubId === currentClubId) {
      refetchData();
    }
  },
});
```

### Pattern 2: Manual Connection Control

```tsx
const { isConnected, connect, disconnect } = useSocketIO({
  autoConnect: false,
});

// Later...
useEffect(() => {
  if (userIsViewingBookings) {
    connect();
  }
  return () => disconnect();
}, [userIsViewingBookings]);
```

### Pattern 3: Integration with Zustand

```tsx
const invalidateBookings = useBookingStore(state => state.invalidateBookings);
const fetchBookings = useBookingStore(state => state.fetchBookingsForDay);

useSocketIO({
  onBookingCreated: (data) => {
    invalidateBookings();
    fetchBookings(clubId, date);
  },
});
```

## Testing

To test these examples:

1. Start the development server with the custom server:
   ```bash
   npm run dev
   ```

2. Open the browser console to see WebSocket logs:
   - `Socket.IO connected: <id>` - Connection established
   - `📅 New booking created:` - Booking created event
   - `✏️ Booking updated:` - Booking updated event
   - `🗑️ Booking deleted:` - Booking deleted event

3. Create/update/delete bookings through the UI or API to trigger real-time updates

## Next Steps

- See [WebSocket Client Setup Documentation](../../docs/websocket-client-setup.md) for complete API reference
- Check [useSocketIO Hook](../hooks/useSocketIO.ts) for implementation details
- Review [Socket Types](../types/socket.ts) for event type definitions

## Need Help?

Common issues and solutions can be found in the [Troubleshooting section](../../docs/websocket-client-setup.md#troubleshooting) of the WebSocket documentation.
