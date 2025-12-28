# User Identity Normalization Pattern

## Overview

This document describes the centralized pattern for handling user identity in API routes. The goal is to ensure consistency between the authenticated session user and the database User record.

## The Problem

Previously, there were inconsistencies in how user identity was handled:

1. **Session vs. Database ID Mismatch**: The `session.user.id` might not match a User record in the database, causing foreign key constraint failures
2. **Untrusted Client Input**: Some endpoints accepted `userId` from the request body for the acting user, which is a security vulnerability
3. **Implicit User Creation**: No consistent pattern for ensuring session users exist in the database

## The Solution: `getCurrentUser()`

The `getCurrentUser()` helper provides a single source of truth for the current user in API routes.

### Location
```typescript
import { getCurrentUser } from "@/lib/getCurrentUser";
```

### What It Does

1. **Verifies authentication** via the session
2. **Ensures database record exists** - looks up the user in the database
3. **Creates user if missing** (idempotent behavior) - handles OAuth and other scenarios where the session exists but the user record doesn't
4. **Returns the full User entity** from the database

### Usage Pattern

#### For User-Acting Endpoints

When an endpoint performs an action **as** the current user (e.g., creating a booking, accepting an invite):

```typescript
export async function POST(request: Request) {
  // Get the current authenticated user from the database
  const userResult = await getCurrentUser();
  if (!userResult.authorized) {
    return userResult.response;
  }

  const currentUser = userResult.user;

  // Use currentUser.id for database operations
  const booking = await prisma.booking.create({
    data: {
      userId: currentUser.id, // ✅ Use DB user ID
      // ...
    }
  });
}
```

#### For Admin Endpoints Operating on Other Users

When an admin performs an action **on behalf of** another user (e.g., assigning roles):

```typescript
export async function POST(request: Request) {
  // Verify admin permissions
  const authResult = await requireRootAdmin(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  const body = await request.json();
  const { userId } = body; // ✅ This is the TARGET user, not the acting user

  // Target user can come from request body - this is legitimate
  await prisma.membership.create({
    data: {
      userId, // Target user specified by admin
      organizationId,
      role: "ORGANIZATION_ADMIN",
    }
  });
}
```

## Request DTO Guidelines

### ❌ DON'T: Include userId for Acting User

```typescript
// BAD - userId should not come from client for acting user
interface BookingRequest {
  courtId: string;
  startTime: string;
  userId: string; // ❌ Security issue!
}
```

### ✅ DO: Omit userId for Acting User

```typescript
// GOOD - userId determined server-side from session
interface BookingRequest {
  courtId: string;
  startTime: string;
  // No userId - implied from authenticated session
}
```

### ✅ DO: Include userId for Target User in Admin Operations

```typescript
// GOOD - userId is the target user for admin operation
interface AssignAdminRequest {
  organizationId: string;
  userId: string; // ✅ Target user specified by admin
  role: string;
}
```

## Migration Checklist

When refactoring an existing endpoint:

- [ ] Import `getCurrentUser` instead of `requireAuth`
- [ ] Replace `requireAuth(request)` with `getCurrentUser()`
- [ ] Update variable name from `userId` to `currentUser`
- [ ] Use `currentUser.id` for database operations
- [ ] Remove `userId` from request body interface (if it represents the acting user)
- [ ] Update request validation to not require `userId` from client
- [ ] Update tests to mock `getCurrentUser` behavior
- [ ] Verify foreign key constraints are satisfied

## Examples

### Example 1: Booking Creation (User-Acting Endpoint)

**Before:**
```typescript
const authResult = await requireAuth(request);
if (!authResult.authorized) return authResult.response;

const body: BookingRequest = await request.json();
const { userId, courtId, startTime } = body; // ❌ userId from client

await prisma.booking.create({
  data: { userId, courtId, start: startTime }
});
```

**After:**
```typescript
const userResult = await getCurrentUser();
if (!userResult.authorized) return userResult.response;

const currentUser = userResult.user;
const body = await request.json();
const { courtId, startTime } = body; // ✅ No userId from client

await prisma.booking.create({
  data: { 
    userId: currentUser.id, // ✅ userId from DB
    courtId, 
    start: startTime 
  }
});
```

### Example 2: Invite Creation

**Before:**
```typescript
const authResult = await requireAuth(request);
const { userId } = authResult; // ❌ userId from session, may not exist in DB

await prisma.invite.create({
  data: {
    email: "user@example.com",
    invitedByUserId: userId // ❌ Might violate foreign key
  }
});
```

**After:**
```typescript
const userResult = await getCurrentUser();
const currentUser = userResult.user; // ✅ Guaranteed to exist in DB

await prisma.invite.create({
  data: {
    email: "user@example.com",
    invitedByUserId: currentUser.id // ✅ DB user ID
  }
});
```

## Testing

When writing tests for endpoints using `getCurrentUser`:

```typescript
jest.mock("@/lib/getCurrentUser", () => ({
  getCurrentUser: jest.fn(),
}));

import { getCurrentUser } from "@/lib/getCurrentUser";
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;

// In your test:
mockGetCurrentUser.mockResolvedValue({
  authorized: true,
  user: {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    // ... other User fields
  }
});
```

## Benefits

1. **Security**: Acting user ID cannot be spoofed from client
2. **Consistency**: Session user always maps to a database User record
3. **Reliability**: Foreign key constraints are satisfied
4. **Idempotent**: Users are created automatically if missing (e.g., OAuth flows)
5. **Single Source of Truth**: One centralized pattern for all endpoints

## Related Files

- Helper: `/src/lib/getCurrentUser.ts`
- Tests: `/src/__tests__/getCurrentUser.test.ts`
- Example usage:
  - `/src/app/api/invites/route.ts`
  - `/src/app/api/invites/accept/route.ts`
  - `/src/app/api/(player)/bookings/route.ts`
