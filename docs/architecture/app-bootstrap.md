# Application Bootstrap & Initialization Architecture

## Overview

This document describes how ArenaOne initializes global state and connections to ensure they happen **only once per application lifecycle**, not on every page navigation, re-render, or browser tab focus.

## The Problem (Before Fix)

Previously, global initialization was triggered on every:
- Page navigation (even within the same page)
- Browser tab switch (focus change)
- Component re-render
- Session object reference change

This caused:
- **Repeated API requests**: `/api/me`, `/api/socket/token`
- **Socket reconnections**: WebSocket disconnecting and reconnecting unnecessarily
- **Performance issues**: Network overhead and potential race conditions
- **Poor user experience**: Unnecessary loading states

## The Solution (Current Architecture)

### Core Principle
**Global initialization happens ONCE per app lifecycle, not per page or re-render.**

All global side effects are managed at the application level with proper guards to prevent repeated execution.

---

## Bootstrap Flow

### 1. Application Layout (`src/app/layout.tsx`)

The root layout establishes the provider hierarchy:

```
<SessionProvider>           ← NextAuth session management
  <UserStoreInitializer />  ← Initializes user store ONCE
  <SocketProvider>          ← Initializes socket ONCE
    <GlobalSocketListener /> ← Subscribes to socket events ONCE
    {children}              ← Page content
  </SocketProvider>
</SessionProvider>
```

**Execution order:**
1. SessionProvider mounts
2. UserStoreInitializer loads user data
3. SocketProvider connects WebSocket
4. GlobalSocketListener subscribes to events
5. Pages render

---

## Component-Level Initialization

### UserStoreInitializer (`src/components/UserStoreInitializer.tsx`)

**Purpose**: Load user data from `/api/me` and populate the Zustand user store

**Initialization Guard**: `hasInitialized` state flag

**Behavior**:
- Waits for Zustand hydration (localStorage restore)
- Waits for NextAuth status to be determined
- Loads user data **once** when authenticated
- Clears user data when unauthenticated
- **Does NOT** reload on re-renders or tab focus

**Dependencies**: `[status, isHydrated]` (stable values only)

```typescript
// Inside UserStoreInitializer
const [hasInitialized, setHasInitialized] = useState(false);

useEffect(() => {
  if (!isHydrated) return;
  if (hasInitialized) return; // ← GUARD: prevents re-initialization
  if (status === "loading") return;

  if (status === "authenticated") {
    loadUser().finally(() => setHasInitialized(true));
  }
}, [status, isHydrated, hasInitialized]);
```

---

### SocketProvider (`src/contexts/SocketContext.tsx`)

**Purpose**: Establish a single WebSocket connection for the entire application

**Initialization Guards**:
1. `hasInitializedRef` - ref-based flag (persists across renders)
2. `socketRef.current` - checks if socket already exists

**Behavior**:
- Fetches socket token from `/api/socket/token` **once**
- Creates Socket.IO connection **once**
- Handles automatic reconnection on network issues
- **Does NOT** reconnect on tab focus or navigation
- Only disconnects when user logs out

**Dependencies**: `[status, userId]` (stable values only)
- **NOT** `[session, status]` - session object changes on every render
- Uses `session?.user?.id` as a stable identifier

```typescript
// Inside SocketProvider
const hasInitializedRef = useRef(false);
const userId = session?.user?.id; // Extract stable ID

useEffect(() => {
  if (status !== 'authenticated' || !userId) {
    // User logged out - cleanup
    if (socketRef.current) {
      socketRef.current.disconnect();
      hasInitializedRef.current = false;
    }
    return;
  }

  // GUARD: prevents re-initialization
  if (hasInitializedRef.current || socketRef.current) {
    return;
  }

  hasInitializedRef.current = true;
  initializeSocket();
}, [status, userId]); // Stable dependencies only
```

---

### GlobalSocketListener (`src/components/GlobalSocketListener.tsx`)

**Purpose**: Subscribe to all Socket.IO events and dispatch them to stores/notifications

**Initialization Guard**: `socket` dependency

**Behavior**:
- Subscribes to events **once** when socket becomes available
- Updates Zustand stores (BookingStore, NotificationStore)
- Shows toast notifications
- **Does NOT** re-subscribe on re-renders or navigation

**Dependencies**: `[socket]` (stable socket instance)

```typescript
// Inside GlobalSocketListener
useEffect(() => {
  if (!socket) return;

  // Register event handlers
  socket.on('booking_created', handleBookingCreated);
  socket.on('booking_updated', handleBookingUpdated);
  // ... other events

  return () => {
    // Cleanup handlers when socket changes or component unmounts
    socket.off('booking_created', handleBookingCreated);
    socket.off('booking_updated', handleBookingUpdated);
  };
}, [socket]); // Only re-run when socket instance changes
```

---

## What Runs Once vs What Is Page-Scoped

### Runs ONCE per App Lifecycle (Global Bootstrap)

| Component/Store | What Initializes | API Endpoint | Guard Mechanism |
|----------------|------------------|--------------|-----------------|
| UserStoreInitializer | User data & roles | `/api/me` | `hasInitialized` state |
| SocketProvider | WebSocket connection | `/api/socket/token` | `hasInitializedRef` ref |
| GlobalSocketListener | Socket event subscriptions | N/A | `socket` dependency |

These **never** re-run on:
- Page navigation
- Tab focus/blur
- Component re-renders
- Route changes

They **only** re-run when:
- User logs out and logs back in
- Application is refreshed (hard reload)

### Runs Per Page (Page-Scoped)

| Component | What Loads | When |
|-----------|-----------|------|
| Organization List Page | Organization data | On page mount (via Zustand store) |
| Club Detail Page | Club details | On page mount (via Zustand store) |
| Court Availability | Court slots | On page mount + polling |

Page-scoped data uses **Zustand stores** with lazy loading:
- First call: Fetches from API
- Subsequent calls: Returns cached data
- Explicit refresh: `store.refetch()` method

---

## State Management (Zustand Stores)

All stores follow a consistent pattern:

```typescript
interface Store {
  // State
  data: Entity[];
  loading: boolean;
  error: string | null;

  // Actions
  loadData: () => Promise<void>;        // Lazy load (fetch if empty)
  refetch: () => Promise<void>;         // Force reload
  updateFromSocket: (data) => void;     // Real-time updates
}
```

### Global Stores (App-Level)

- **UserStore** (`useUserStore`): User session, roles, admin status
- **NotificationStore** (`useNotificationStore`): Admin notifications

### Entity Stores (Page-Level with Caching)

- **OrganizationStore** (`useOrganizationStore`): Organizations
- **ClubStore** (`useClubStore`): Clubs
- **CourtStore** (`useCourtStore`): Courts
- **BookingStore** (`useBookingStore`): Bookings

---

## Why Repeated Requests Were Happening Before

### Root Cause 1: Session Dependency in SocketProvider

**Problem**:
```typescript
useEffect(() => {
  // ...
}, [session, status]); // ← session object changes on every render!
```

**Why**: NextAuth's `session` object is a **new reference** on every render, even if the content is identical. This caused the `useEffect` to re-run constantly.

**Fix**:
```typescript
const userId = session?.user?.id; // Extract stable primitive value
useEffect(() => {
  // ...
}, [status, userId]); // ← Only depends on stable values
```

### Root Cause 2: Missing Initialization Guards

**Problem**: Even with dependency fixes, components could still re-initialize if React re-mounts them.

**Fix**: Add persistent guards:
- `useRef` for values that must survive re-renders
- State flags (`hasInitialized`) for one-time actions
- Check both flag AND ref before initializing

---

## How the New Flow Prevents Repeated Initialization

### 1. Stable Dependencies
- Only depend on primitive values (`status`, `userId`)
- Never depend on object references (`session`, `user`)

### 2. Initialization Guards
- `hasInitializedRef` (ref) - persists across re-renders
- `hasInitialized` (state) - prevents re-execution in useEffect

### 3. Singleton Patterns
- SocketProvider: One socket instance per app
- UserStoreInitializer: One load per app lifecycle
- Zustand stores: Shared global state

### 4. Proper Cleanup
- Only cleanup on actual logout or unmount
- Don't cleanup on session object changes

---

## Testing Initialization Behavior

### Manual Test Checklist

1. **Initial Load**
   - ✅ `/api/me` called ONCE
   - ✅ `/api/socket/token` called ONCE
   - ✅ Socket connects ONCE

2. **Navigation (same page)**
   - ✅ No additional `/api/me` requests
   - ✅ No socket reconnection
   - ✅ No re-initialization

3. **Tab Switch (focus/blur)**
   - ✅ No additional API requests
   - ✅ Socket remains connected
   - ✅ No re-initialization

4. **Page Navigation (different page)**
   - ✅ No global re-initialization
   - ✅ Socket remains connected
   - ✅ Only page-specific data loads

5. **Logout → Login**
   - ✅ Socket disconnects on logout
   - ✅ `/api/me` called after re-login
   - ✅ Socket reconnects after re-login

### Browser DevTools Check

Open Network tab and filter by:
- `/api/me` - should see 1 request on app load
- `/api/socket/token` - should see 1 request on app load
- `socket.io` - should see 1 WebSocket connection

Switch tabs, navigate pages, wait - **none of these should retrigger**.

---

## Best Practices for Future Development

### When Adding New Global Side Effects

1. **Use the existing providers** (UserStoreInitializer, SocketProvider)
2. **Add initialization guards** (useRef + state flag)
3. **Depend on stable values only** (primitives, not objects)
4. **Test with tab focus changes** to ensure no re-initialization

### When Adding Page-Level Data Loading

1. **Use Zustand stores** for all entity data
2. **Implement lazy loading** (load only if empty)
3. **Don't call fetch() directly** in components
4. **Use `getEntityList()` pattern** for auto-fetching

### Anti-Patterns to Avoid

❌ **Don't**:
```typescript
// Bad: Depends on session object (unstable reference)
useEffect(() => {
  loadData();
}, [session]);

// Bad: No initialization guard
useEffect(() => {
  connectSocket();
}, [isAuthenticated]);

// Bad: Direct fetch in component
const MyPage = () => {
  useEffect(() => {
    fetch('/api/data').then(setData);
  }, []);
};
```

✅ **Do**:
```typescript
// Good: Stable dependencies
const userId = session?.user?.id;
useEffect(() => {
  loadData();
}, [userId]);

// Good: With initialization guard
const hasInitialized = useRef(false);
useEffect(() => {
  if (hasInitialized.current) return;
  hasInitialized.current = true;
  connectSocket();
}, [isAuthenticated]);

// Good: Use store with lazy loading
const MyPage = () => {
  const data = useMyStore(state => state.getDataWithAutoFetch());
};
```

---

## Summary

### Key Takeaways

1. **Global initialization happens once** - guarded by refs and state flags
2. **Stable dependencies only** - primitives, not object references
3. **Zustand stores are the source of truth** - components consume, not fetch
4. **Socket is a singleton** - one connection per app lifecycle
5. **Tab focus doesn't retrigger** - initialization guards prevent it

### Files Modified

- `src/contexts/SocketContext.tsx` - Added `hasInitializedRef`, stable dependencies
- `src/components/UserStoreInitializer.tsx` - Already had proper guards
- `src/components/GlobalSocketListener.tsx` - Already uses stable socket dependency

### Result

✅ No repeated `/api/me` requests  
✅ No repeated `/api/socket/token` requests  
✅ No unnecessary socket reconnections  
✅ No re-initialization on tab focus  
✅ No re-initialization on navigation  
✅ Better performance and user experience  

---

## Further Reading

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [NextAuth.js Session Management](https://next-auth.js.org/getting-started/client)
- [Zustand State Management](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Socket.IO Client Documentation](https://socket.io/docs/v4/client-api/)
