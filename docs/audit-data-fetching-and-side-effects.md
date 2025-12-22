# ArenaOne Application: Data Fetching and Side-Effects Audit

**Date:** 2025-12-22  
**Scope:** Admin and Player pages/components  
**Version:** Current main branch

---

## Executive Summary

This audit identifies all data fetching operations and global side-effects across the ArenaOne application to document redundant operations, categorize them as global vs page-level, and provide recommendations for optimization.

### Key Findings

- **32 total pages** (admin and player)
- **169 total components**
- **243 `useEffect` hooks** across pages and components
- **105 fetch operations** across the codebase
- **50 socket-related operations**
- **Global state management** via 9 Zustand stores with lazy-loading patterns

---

## 1. Global Side-Effects (App-Level)

### 1.1 Session & Authentication
**Location:** `src/components/UserStoreInitializer.tsx`

**Current Behavior:**
- Runs once on app mount via `AuthProvider` in root layout
- Fetches user data from `/api/me` when session becomes authenticated
- Automatically clears user data when session becomes unauthenticated
- Waits for Zustand persist hydration (100ms timeout)

**Triggers:**
- ✅ Initial page load: Yes
- ✅ Component re-render: No (has `hasInitialized` guard)
- ❌ Tab/window switch: No
- ✅ Session change: Yes (intentional)

**Classification:** ✅ **GLOBAL** - Correctly implemented as app-level  
**Issues:** None - properly guarded against duplicate calls  
**Priority:** N/A

---

### 1.2 WebSocket Connection
**Location:** `src/contexts/SocketContext.tsx`

**Current Behavior:**
- Single global socket connection established via `SocketProvider` in root layout
- Connects when user is authenticated
- Reconnects when `activeClubId` changes (for room targeting)
- Fetches JWT token from `/api/socket/token` before connecting

**Triggers:**
- ✅ Initial page load: Yes (when authenticated)
- ❌ Component re-render: No (uses `socketRef.current` guard)
- ❌ Tab/window switch: No
- ✅ Session change: Yes (disconnects on logout)
- ✅ Active club change: Yes (reconnects to new room)

**Classification:** ✅ **GLOBAL** - Correctly implemented as app-level  
**Issues:** None - proper singleton pattern with cleanup  
**Priority:** N/A

---

### 1.3 Socket Event Listeners
**Location:** `src/components/GlobalSocketListener.tsx`

**Current Behavior:**
- Subscribes to all Socket.IO events globally
- Updates Zustand stores (booking store, notification store)
- Displays toast notifications via `globalNotificationManager`
- Handles: booking events, payment events, slot locking, admin notifications
- Runs cleanup interval for expired slot locks (every 60 seconds)

**Triggers:**
- ✅ Initial page load: Yes (when socket connects)
- ❌ Component re-render: No (stable dependencies)
- ❌ Tab/window switch: No
- ✅ Socket reconnection: Yes (re-registers handlers)

**Classification:** ✅ **GLOBAL** - Correctly implemented as app-level  
**Issues:** None - centralized event handling prevents duplicate listeners  
**Priority:** N/A

---

### 1.4 Notification Store Initialization
**Location:** `src/components/NotificationStoreInitializer.tsx`

**Current Behavior:**
- Fetches initial notifications from `/api/admin/notifications`
- Runs once per session for admin users only
- After initial load, relies on WebSocket events for updates

**Triggers:**
- ✅ Initial page load: Yes (for admin users)
- ❌ Component re-render: No (has `hasInitialized.current` guard)
- ❌ Tab/window switch: No
- ❌ User role change: No (only checks on mount)

**Classification:** ✅ **GLOBAL** - Correctly implemented as app-level  
**Issues:** None - proper one-time initialization  
**Priority:** N/A

---

### 1.5 Club Context (Active Club Selection)
**Location:** `src/contexts/ClubContext.tsx`

**Current Behavior:**
- Tracks currently active/selected club across the application
- Persists selection in localStorage
- Used by SocketProvider to determine which club room to join
- Hydrates from localStorage on mount (with hydration guard)

**Triggers:**
- ✅ Initial page load: Yes (hydrates from localStorage)
- ❌ Component re-render: No (stable state management)
- ❌ Tab/window switch: No
- ✅ Manual club change: Yes (via `setActiveClubId`)

**Classification:** ✅ **GLOBAL** - Correctly implemented as app-level  
**Issues:** None - proper state persistence  
**Priority:** N/A

---

## 2. Zustand Store Data Fetching (Lazy-Loading Pattern)

All entity stores follow a consistent lazy-loading pattern with inflight guards to prevent duplicate requests.

### 2.1 User Store
**Location:** `src/stores/useUserStore.ts`

**Endpoints:**
- `/api/me` - fetches user info, roles, admin status, memberships

**Pattern:** 
- Manual initialization via `UserStoreInitializer`
- Persisted to localStorage
- `loadUser()` - can be called multiple times safely
- `reloadUser()` - force refresh after role changes

**Issues:** None - proper implementation  
**Priority:** N/A

---

### 2.2 Club Stores (Admin & Player)
**Locations:** 
- `src/stores/useAdminClubStore.ts` (admin)
- `src/stores/usePlayerClubStore.ts` (player)
- `src/stores/useClubStore.ts` (deprecated)

**Endpoints:**
- `/api/admin/clubs` - admin club list
- `/api/admin/clubs/:id` - admin club detail
- `/api/player/clubs` - player club list
- `/api/player/clubs/:id` - player club detail

**Pattern:**
- `fetchClubsIfNeeded({ organizationId })` - lazy load with context invalidation
- `ensureClubById(id)` - lazy load individual clubs
- Inflight guards prevent concurrent duplicate requests
- Context-based caching (invalidates when organizationId changes)

**Issues:** None - proper lazy-loading with guards  
**Priority:** N/A

---

### 2.3 Booking Store
**Location:** `src/stores/useBookingStore.ts`

**Endpoints:**
- `/api/clubs/:clubId/operations/bookings?date=:date`
- `/api/admin/bookings/create`
- `/api/admin/bookings/:id`

**Pattern:**
- `fetchBookingsForDay(clubId, date)` - fetches bookings
- `fetchBookingsIfNeeded(clubId, date, { force })` - lazy load with 5-second cache
- Inflight guards prevent duplicate requests
- Real-time updates via Socket.IO (not polling)
- Slot locking with automatic expiration cleanup

**Issues:** None - proper implementation with real-time sync  
**Priority:** N/A

---

### 2.4 Court Store
**Location:** `src/stores/useCourtStore.ts`

**Endpoints:**
- `/api/admin/courts?clubId=:clubId`
- `/api/admin/courts/:id`

**Pattern:**
- `fetchCourtsIfNeeded({ clubId })` - lazy load with context
- Context-based invalidation when clubId changes
- Inflight guards

**Issues:** None - proper implementation  
**Priority:** N/A

---

### 2.5 Organization Store
**Location:** `src/stores/useOrganizationStore.ts`

**Endpoints:**
- `/api/admin/organizations`
- `/api/admin/organizations/:id`

**Pattern:**
- `fetchOrganizationsIfNeeded()` - lazy load
- Individual organization fetch with caching
- Inflight guards

**Issues:** None - proper implementation  
**Priority:** N/A

---

### 2.6 Notification Store
**Location:** `src/stores/useNotificationStore.ts`

**Endpoints:**
- `/api/admin/notifications` (initial load only, via initializer)
- Updates via WebSocket events only

**Pattern:**
- Initial HTTP fetch via `NotificationStoreInitializer`
- All subsequent updates via Socket.IO events
- No polling
- Mark as read/unread operations

**Issues:** None - proper implementation  
**Priority:** N/A

---

## 3. Admin Pages Data Fetching

### 3.1 Admin Dashboard
**Location:** `src/app/(pages)/admin/dashboard/page.tsx`

**Endpoints:**
- `/api/admin/unified-dashboard`

**Current Behavior:**
- Fetches unified dashboard data on mount
- Role-based data (Root, Organization, Club admin)
- No caching - refetches on every mount
- `refreshDashboard()` callback for manual refresh

**Triggers:**
- ✅ Initial page load: Yes
- ✅ Component re-render: No (proper guards with `isHydrated`, `isLoading`)
- ✅ Tab/window switch: No
- ❌ Navigation back to page: Yes (refetches)

**Classification:** **PAGE-LEVEL**  
**Issues:** 
- ⚠️ **MEDIUM**: Refetches on every navigation to dashboard
- No caching mechanism for dashboard data
- Could benefit from short-term cache (30-60 seconds)

**Recommendation:**
- Add 30-second cache to prevent redundant fetches on quick navigation
- Store last fetch timestamp and skip if recent

**Priority:** MEDIUM

---

### 3.2 Admin Operations (Club-Specific)
**Location:** `src/app/(pages)/admin/operations/[clubId]/page.tsx`

**Endpoints:**
- Uses stores: `useAdminClubStore`, `useCourtStore`, `useBookingStore`
- `/api/admin/clubs/:id` (via store)
- `/api/admin/courts?clubId=:clubId` (via store)
- `/api/clubs/:clubId/operations/bookings?date=:date` (via store)

**Current Behavior:**
- Loads club, courts, and bookings via stores
- Sets active club for socket room targeting
- Real-time updates via WebSocket
- Bookings refetch on date change

**Triggers:**
- ✅ Initial page load: Yes
- ❌ Component re-render: No (store-based guards)
- ❌ Tab/window switch: No
- ✅ Date change: Yes (intentional refetch)
- ✅ Real-time updates: Yes (via Socket.IO)

**Classification:** **PAGE-LEVEL**  
**Issues:** None - proper use of stores with lazy-loading  
**Priority:** N/A

---

### 3.3 Admin Clubs List
**Location:** `src/app/(pages)/admin/clubs/page.tsx`

**Endpoints:**
- Uses `useAdminClubStore`
- `/api/admin/clubs?organizationId=:orgId`

**Current Behavior:**
- Fetches clubs via store on mount
- Client-side filtering and sorting
- Refetches when organizationFilter changes
- Pagination handled client-side

**Triggers:**
- ✅ Initial page load: Yes
- ❌ Component re-render: No (store guards)
- ❌ Tab/window switch: No
- ✅ Organization filter change: Yes (invalidates cache, refetches)

**Classification:** **PAGE-LEVEL**  
**Issues:** None - proper lazy-loading with context invalidation  
**Priority:** N/A

---

### 3.4 Admin Bookings Page
**Location:** `src/app/(pages)/admin/bookings/page.tsx`

**Endpoints:**
- `/api/admin/bookings?date=:date&clubId=:clubId&status=:status`

**Current Behavior:**
- Direct fetch (not using store)
- Fetches on mount and when filters change
- No caching mechanism

**Triggers:**
- ✅ Initial page load: Yes
- ❌ Component re-render: No (proper useEffect dependencies)
- ❌ Tab/window switch: No
- ✅ Filter change: Yes (date, club, status)
- ❌ Navigation back: Yes (refetches)

**Classification:** **PAGE-LEVEL**  
**Issues:**
- ⚠️ **MEDIUM**: Not using booking store
- Bypasses centralized state management
- Could benefit from store integration

**Recommendation:**
- Integrate with `useBookingStore` for consistency
- Add caching to prevent redundant fetches

**Priority:** MEDIUM

---

### 3.5 Admin Organizations List
**Location:** `src/app/(pages)/admin/organizations/page.tsx`

**Endpoints:**
- `/api/admin/organizations` (direct fetch, not using store)

**Current Behavior:**
- Direct fetch on mount
- Client-side filtering and sorting
- No caching

**Triggers:**
- ✅ Initial page load: Yes
- ❌ Component re-render: No (proper guards)
- ❌ Tab/window switch: No
- ❌ Navigation back: Yes (refetches)

**Classification:** **PAGE-LEVEL**  
**Issues:**
- ⚠️ **LOW**: Has `useOrganizationStore` but page doesn't use it
- Direct fetch instead of store
- Inconsistent with architecture guidelines

**Recommendation:**
- Use `useOrganizationStore` for consistency
- Leverage lazy-loading pattern

**Priority:** LOW

---

### 3.6 Admin Courts Pages
**Locations:**
- `src/app/(pages)/admin/courts/page.tsx` (list)
- `src/app/(pages)/admin/courts/[courtId]/page.tsx` (detail)
- `src/app/(pages)/admin/courts/[courtId]/price-rules/page.tsx`

**Endpoints:**
- Uses `useCourtStore` appropriately
- `/api/admin/courts?clubId=:clubId`
- `/api/admin/courts/:id`

**Current Behavior:**
- Proper store usage with lazy-loading
- Context-based caching (clubId)

**Classification:** **PAGE-LEVEL**  
**Issues:** None  
**Priority:** N/A

---

### 3.7 Admin Club Detail Pages
**Locations:**
- `src/app/(pages)/admin/clubs/[id]/page.tsx`
- `src/app/(pages)/admin/clubs/[id]/courts/page.tsx`
- `src/app/(pages)/admin/clubs/[id]/courts/[courtId]/page.tsx`

**Endpoints:**
- Uses `useAdminClubStore` and `useCourtStore`
- Proper lazy-loading

**Classification:** **PAGE-LEVEL**  
**Issues:** None  
**Priority:** N/A

---

### 3.8 Admin Notifications Page
**Location:** `src/app/(pages)/admin/notifications/page.tsx`

**Endpoints:**
- Uses `useNotificationStore`
- No direct fetching (relies on store initialization)

**Current Behavior:**
- Reads from store
- Real-time updates via WebSocket
- No redundant fetches

**Classification:** **PAGE-LEVEL**  
**Issues:** None - proper store usage  
**Priority:** N/A

---

## 4. Player Pages Data Fetching

### 4.1 Player Dashboard
**Location:** `src/app/(pages)/(player)/dashboard/page.tsx`

**Endpoints:**
- `/api/clubs` (clubs with coaches)
- `/api/bookings?userId=:userId&upcoming=true`
- Uses `usePlayerClubStore` for clubs

**Current Behavior:**
- Fetches clubs via store
- Fetches bookings directly (not using store)
- Fetches coaches from clubs endpoint
- All fetch on mount when user is authenticated

**Triggers:**
- ✅ Initial page load: Yes
- ❌ Component re-render: No (proper guards)
- ❌ Tab/window switch: No
- ❌ Navigation back: Yes (refetches bookings)

**Classification:** **PAGE-LEVEL**  
**Issues:**
- ⚠️ **MEDIUM**: Direct booking fetch bypasses store
- Coaches fetched from clubs endpoint (could be cached)
- No caching for bookings

**Recommendation:**
- Create player-specific booking store or extend existing one
- Cache bookings with short TTL (60 seconds)

**Priority:** MEDIUM

---

### 4.2 Player Clubs List
**Location:** `src/app/(pages)/(player)/clubs/page.tsx`

**Endpoints:**
- `/api/clubs?q=:query&city=:city&indoor=:indoor` (direct fetch)

**Current Behavior:**
- Direct fetch with URL-based filtering
- Not using `usePlayerClubStore`
- Server-side filtering required
- Refetches on every filter change

**Triggers:**
- ✅ Initial page load: Yes
- ❌ Component re-render: No (proper guards)
- ❌ Tab/window switch: No
- ✅ Filter change: Yes (intentional)
- ✅ Navigation back: Yes (refetches)

**Classification:** **PAGE-LEVEL**  
**Issues:**
- ⚠️ **LOW**: Not using store (intentional due to server-side filtering)
- Comment in code acknowledges this design decision
- Could benefit from query-based caching

**Recommendation:**
- Add short-term cache for identical queries (30 seconds)
- Consider extending store to support query parameters

**Priority:** LOW

---

### 4.3 Player Club Detail
**Location:** `src/app/(pages)/(player)/clubs/[id]/page.tsx`

**Endpoints:**
- Uses `usePlayerClubStore` appropriately
- `/api/player/clubs/:id`

**Current Behavior:**
- Proper store usage with lazy-loading
- Caches club details

**Classification:** **PAGE-LEVEL**  
**Issues:** None  
**Priority:** N/A

---

## 5. Components with Data Fetching

### 5.1 RegisteredUsersCard
**Location:** `src/components/admin/RegisteredUsersCard.tsx`

**Endpoints:**
- `/api/admin/dashboard/registered-users`

**Current Behavior:**
- Fetches on component mount
- No caching
- Used only in admin dashboard

**Triggers:**
- ✅ Component mount: Yes
- ❌ Component re-render: No (empty deps array)
- ❌ Tab/window switch: No

**Classification:** **PAGE-LEVEL** (component-scoped)  
**Issues:**
- ⚠️ **LOW**: No caching mechanism
- Refetches when dashboard remounts

**Recommendation:**
- Move to dashboard-level fetch or add caching

**Priority:** LOW

---

### 5.2 DashboardGraphs
**Location:** `src/components/admin/DashboardGraphs.tsx`

**Endpoints:**
- `/api/admin/dashboard/graphs?timeRange=:range`

**Current Behavior:**
- Fetches on mount
- Refetches when time range changes
- No caching

**Triggers:**
- ✅ Component mount: Yes
- ❌ Component re-render: No
- ✅ Time range change: Yes (intentional)

**Classification:** **PAGE-LEVEL** (component-scoped)  
**Issues:**
- ⚠️ **LOW**: No caching for same time range
- Refetches on dashboard remount

**Recommendation:**
- Add 60-second cache per time range
- Consider moving to dashboard page level

**Priority:** LOW

---

### 5.3 AdminQuickBookingWizard
**Location:** `src/components/AdminQuickBookingWizard/AdminQuickBookingWizard.tsx`

**Endpoints:**
- Uses stores: `useAdminClubStore`, `useCourtStore`
- Various endpoints via stores

**Current Behavior:**
- Proper store usage
- Lazy-loads data as needed

**Classification:** **COMPONENT-LEVEL**  
**Issues:** None  
**Priority:** N/A

---

### 5.4 QuickBookingModal & PlayerQuickBooking
**Locations:**
- `src/components/QuickBookingModal.tsx`
- `src/components/PlayerQuickBooking/PlayerQuickBooking.tsx`

**Endpoints:**
- `/api/clubs/:clubId/courts/:courtId/availability`
- `/api/clubs/:clubId/courts`

**Current Behavior:**
- Fetches court availability when modal opens
- Fetches courts for club selection
- No caching between opens

**Triggers:**
- ✅ Modal open: Yes
- ❌ Modal re-open: Yes (refetches)
- ✅ Date/time change: Yes (intentional)

**Classification:** **COMPONENT-LEVEL**  
**Issues:**
- ⚠️ **MEDIUM**: Refetches availability on every modal open
- No caching for recent queries

**Recommendation:**
- Add 30-second cache for availability queries
- Cache court list per club

**Priority:** MEDIUM

---

### 5.5 WeeklyAvailabilityTimeline
**Location:** `src/components/WeeklyAvailabilityTimeline.tsx`

**Endpoints:**
- `/api/clubs/:clubId/courts/:courtId/weekly-availability`

**Current Behavior:**
- Fetches weekly availability on mount
- Refetches when court/date changes
- No caching

**Triggers:**
- ✅ Component mount: Yes
- ✅ Court/date change: Yes (intentional)

**Classification:** **COMPONENT-LEVEL**  
**Issues:**
- ⚠️ **LOW**: No caching for same court/date
- Could benefit from short-term cache

**Recommendation:**
- Add 60-second cache for same court/date combination

**Priority:** LOW

---

### 5.6 BookingModal & BookingDetailsModal
**Locations:**
- `src/components/booking/BookingModal.tsx`
- `src/components/admin/BookingDetailsModal.tsx`

**Endpoints:**
- `/api/bookings/:id`
- Various booking operations

**Current Behavior:**
- Fetches booking details when modal opens
- Some use store, some direct fetch

**Classification:** **COMPONENT-LEVEL**  
**Issues:**
- ⚠️ **LOW**: Inconsistent - some use store, some don't
- Could be more unified

**Recommendation:**
- Standardize on store usage
- Add caching for booking details

**Priority:** LOW

---

### 5.7 Club Management Components
**Locations:**
- `src/components/admin/club/ClubCourtsQuickList.tsx`
- `src/components/admin/club/ClubCoachesView.tsx`
- `src/components/admin/club/ClubGalleryView.tsx`
- `src/components/admin/club/ClubAdminsSection.tsx`

**Endpoints:**
- Various club-related endpoints
- Mix of direct fetch and store usage

**Current Behavior:**
- Some components fetch directly
- Some use parent-provided data
- Inconsistent patterns

**Classification:** **COMPONENT-LEVEL**  
**Issues:**
- ⚠️ **MEDIUM**: Inconsistent data fetching patterns
- Some components refetch data that parent already has

**Recommendation:**
- Standardize on receiving data via props or store
- Avoid direct fetching in child components when parent has data

**Priority:** MEDIUM

---

## 6. Redundant Operations Summary

### 6.1 HIGH Priority Issues

**None identified** - No critical redundant operations found.

---

### 6.2 MEDIUM Priority Issues

1. **Admin Dashboard - No Caching**
   - Location: `src/app/(pages)/admin/dashboard/page.tsx`
   - Issue: Refetches on every navigation to dashboard
   - Impact: Unnecessary API calls on quick navigation
   - Recommendation: Add 30-60 second cache

2. **Admin Bookings Page - No Store Integration**
   - Location: `src/app/(pages)/admin/bookings/page.tsx`
   - Issue: Direct fetch instead of using booking store
   - Impact: Bypasses centralized state management
   - Recommendation: Integrate with `useBookingStore`

3. **Player Dashboard - Direct Booking Fetch**
   - Location: `src/app/(pages)/(player)/dashboard/page.tsx`
   - Issue: Fetches bookings directly instead of using store
   - Impact: No caching, refetches on every mount
   - Recommendation: Create player booking store or extend existing

4. **QuickBookingModal - No Availability Caching**
   - Location: `src/components/QuickBookingModal.tsx`
   - Issue: Refetches availability on every modal open
   - Impact: Redundant API calls for recent queries
   - Recommendation: Add 30-second cache

5. **Club Management Components - Inconsistent Patterns**
   - Locations: Various admin club components
   - Issue: Mix of direct fetch and store usage
   - Impact: Potential duplicate fetches, inconsistent architecture
   - Recommendation: Standardize on store or prop-based data flow

---

### 6.3 LOW Priority Issues

1. **Admin Organizations Page - Not Using Store**
   - Location: `src/app/(pages)/admin/organizations/page.tsx`
   - Issue: Has store available but uses direct fetch
   - Impact: Inconsistent with architecture
   - Recommendation: Use `useOrganizationStore`

2. **RegisteredUsersCard - No Caching**
   - Location: `src/components/admin/RegisteredUsersCard.tsx`
   - Issue: Refetches on dashboard remount
   - Impact: Minor redundant API call
   - Recommendation: Move to dashboard-level or add caching

3. **DashboardGraphs - No Caching**
   - Location: `src/components/admin/DashboardGraphs.tsx`
   - Issue: Refetches on component remount
   - Impact: Minor redundant API call for same time range
   - Recommendation: Add 60-second cache per time range

4. **Player Clubs List - No Query Caching**
   - Location: `src/app/(pages)/(player)/clubs/page.tsx`
   - Issue: Refetches on navigation back with same filters
   - Impact: Redundant API calls for identical queries
   - Recommendation: Add query-based caching (30 seconds)

5. **WeeklyAvailabilityTimeline - No Caching**
   - Location: `src/components/WeeklyAvailabilityTimeline.tsx`
   - Issue: No cache for same court/date
   - Impact: Minor redundant fetches
   - Recommendation: Add 60-second cache

---

## 7. Architecture Compliance

### ✅ Strengths

1. **Global Side-Effects Properly Centralized**
   - Session management: Single initialization
   - WebSocket: Singleton pattern with proper cleanup
   - Socket events: Centralized dispatcher
   - Notification initialization: One-time load

2. **Store Pattern Consistently Implemented**
   - All stores use lazy-loading with `fetchIfNeeded`
   - Inflight guards prevent duplicate concurrent requests
   - Context-based invalidation (e.g., clubId, organizationId)
   - Proper cleanup and state management

3. **No Polling**
   - All real-time updates via WebSocket events
   - No unnecessary background polling detected

4. **Proper Guards and Memoization**
   - Most components use proper `useEffect` dependencies
   - Guards prevent duplicate initialization
   - Memoization used appropriately

---

### ⚠️ Areas for Improvement

1. **Inconsistent Store Usage**
   - Some pages use stores, others use direct fetch
   - Recommendation: Standardize on store-first approach

2. **Missing Caching Layer**
   - Dashboard pages refetch on every navigation
   - Modal components refetch on every open
   - Recommendation: Add short-term cache (30-60 seconds)

3. **Component-Level Fetching**
   - Some components fetch data instead of receiving via props
   - Can lead to duplicate fetches when parent already has data
   - Recommendation: Prefer prop-based data flow

---

## 8. Recommendations

### 8.1 Immediate Actions (Medium Priority)

1. **Implement Dashboard Caching**
   - Add 30-60 second cache for unified dashboard data
   - Prevents redundant fetches on quick navigation

2. **Standardize Booking Store Usage**
   - Admin bookings page should use `useBookingStore`
   - Player dashboard should extend or use booking store

3. **Add Availability Query Caching**
   - QuickBookingModal and similar components
   - 30-second cache for recent queries

4. **Standardize Club Component Patterns**
   - Club management components should use consistent data flow
   - Prefer store or prop-based over direct fetching

---

### 8.2 Future Enhancements (Low Priority)

1. **Centralize More Page Data in Stores**
   - Organizations page → use `useOrganizationStore`
   - Player clubs list → extend store with query support

2. **Add Query-Based Caching**
   - Cache results based on query parameters
   - TTL: 30-60 seconds for list endpoints

3. **Dashboard Component Optimization**
   - RegisteredUsersCard and DashboardGraphs
   - Move fetching to page level or add component-level cache

4. **Availability Caching**
   - WeeklyAvailabilityTimeline and similar
   - Short-term cache for same court/date combinations

---

## 9. Conclusion

The ArenaOne application demonstrates **strong adherence to architectural patterns** for global state management and side-effects. The global providers (session, socket, notifications) are properly centralized and follow singleton patterns with appropriate guards.

The **Zustand store implementation is exemplary**, with consistent lazy-loading patterns, inflight guards, and context-based invalidation. Real-time updates are handled efficiently via WebSocket events without any polling.

**Main areas for improvement:**
1. Some inconsistency in store usage vs direct fetching
2. Missing short-term caching for frequently re-navigated pages
3. Component-level fetching in some cases where prop-based flow would be better

**Overall Assessment:** The codebase is well-architected with only **MEDIUM** and **LOW** priority issues. No critical redundant operations or architectural violations were found. The identified improvements are optimization opportunities rather than critical fixes.

---

## Appendix A: Store Reference

| Store | Location | Endpoints | Pattern |
|-------|----------|-----------|---------|
| useUserStore | `src/stores/useUserStore.ts` | `/api/me` | Global init, persisted |
| useAdminClubStore | `src/stores/useAdminClubStore.ts` | `/api/admin/clubs*` | Lazy-load, context-based |
| usePlayerClubStore | `src/stores/usePlayerClubStore.ts` | `/api/player/clubs*` | Lazy-load |
| useBookingStore | `src/stores/useBookingStore.ts` | `/api/clubs/:id/operations/bookings` | Lazy-load, real-time |
| useCourtStore | `src/stores/useCourtStore.ts` | `/api/admin/courts*` | Lazy-load, context-based |
| useOrganizationStore | `src/stores/useOrganizationStore.ts` | `/api/admin/organizations*` | Lazy-load |
| useNotificationStore | `src/stores/useNotificationStore.ts` | `/api/admin/notifications` | Init + WebSocket |
| useAdminUsersStore | `src/stores/useAdminUsersStore.ts` | `/api/admin/users*` | Lazy-load |

---

## Appendix B: Global Initializers

| Component | Location | Trigger | Runs |
|-----------|----------|---------|------|
| AuthProvider | `src/components/AuthProvider.tsx` | App mount | Once |
| UserStoreInitializer | `src/components/UserStoreInitializer.tsx` | Session auth | Once per session |
| ClubProvider | `src/contexts/ClubContext.tsx` | App mount | Once |
| SocketProvider | `src/contexts/SocketContext.tsx` | User auth | Once per session |
| GlobalSocketListener | `src/components/GlobalSocketListener.tsx` | Socket connect | Once per connection |
| NotificationStoreInitializer | `src/components/NotificationStoreInitializer.tsx` | Admin auth | Once per session |

---

**End of Audit Report**
