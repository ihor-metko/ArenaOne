# Session Fetch Verification

This document describes how to verify that the session is only fetched once on app initialization.

## Changes Made

1. **Removed SessionProvider**: The `SessionProvider` from NextAuth was removed from `AuthProvider.tsx`. This eliminates NextAuth's automatic session polling and refetching.

2. **Added sessionStatus to User Store**: The `useUserStore` now tracks `sessionStatus` ("loading" | "authenticated" | "unauthenticated") independently of NextAuth hooks.

3. **Replaced useSession() calls**: All components that used `useSession()` now use the user store:
   - `SocketContext.tsx` - Uses `sessionStatus` from store
   - `useRoleGuard.ts` - Uses `sessionStatus` from store
   - `PersonalizedSectionWrapper.tsx` - Uses `sessionStatus` from store
   - `SignInPage.tsx` - Uses `sessionStatus` from store

4. **Single Session Fetch**: The `UserStoreInitializer` component fetches the session once on app initialization via the `/api/me` endpoint and stores it in the global Zustand store.

## How to Verify

### Using Browser DevTools

1. Open the application in a browser
2. Open DevTools (F12)
3. Go to the Network tab
4. Filter by "Fetch/XHR"
5. Clear the network log
6. Refresh the page
7. Look for requests to `/api/me` or `/api/auth/session`

**Expected Result**: 
- You should see only ONE request to `/api/me` on initial page load
- NO requests to `/api/auth/session` should appear
- Navigation between pages should NOT trigger additional session fetches

### Using Console Logging

The `loadUser()` function in the user store includes console logging for debugging:

```typescript
console.error("Failed to load user:", error);
```

You can temporarily add more logging to track when the session is fetched:

```typescript
loadUser: async () => {
  console.log("[UserStore] Loading user session...");
  set({ isLoading: true, sessionStatus: "loading" });
  // ... rest of the function
}
```

### Testing Authentication Flow

1. **Login**: 
   - Go to `/auth/sign-in`
   - Enter credentials and sign in
   - Verify only one session fetch occurs after successful login

2. **Navigation**:
   - Navigate between pages (e.g., /clubs, /courts, /admin)
   - Verify no additional session fetches occur

3. **Re-renders**:
   - Interact with UI components that cause re-renders
   - Verify no additional session fetches occur

4. **Logout**:
   - Click logout
   - Verify the store is cleared and sessionStatus becomes "unauthenticated"

## Key Files Modified

- `src/stores/useUserStore.ts` - Added `sessionStatus` state
- `src/components/AuthProvider.tsx` - Removed `SessionProvider`
- `src/components/UserStoreInitializer.tsx` - Removed `useSession()` dependency
- `src/contexts/SocketContext.tsx` - Uses store instead of `useSession()`
- `src/hooks/useRoleGuard.ts` - Uses store instead of `useSession()`
- `src/components/home/PersonalizedSectionWrapper.tsx` - Uses store instead of `useSession()`
- `src/app/(pages)/auth/sign-in/page.tsx` - Uses store instead of `useSession()`

## Production Behavior

In production (with React Strict Mode disabled), you should see:
- Exactly ONE `/api/me` request on app initialization
- NO `/api/auth/session` requests at all
- NO session refetches on navigation or re-renders

In development (with React Strict Mode enabled), you may see the request twice due to React's double-invocation, but this is expected and won't happen in production.
