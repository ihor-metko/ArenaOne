# Special Dates CRUD API Documentation

## Overview

This document describes the API endpoints for managing special date overrides for clubs. Special dates are time-based domain entities that override the regular business hours for specific dates (e.g., holidays, events, temporary closures).

## Important Notes

- Each special date is treated as an **independent entity**
- All operations are **non-destructive** (no batch replace logic)
- Each endpoint operates on a **single special date**
- Proper CRUD semantics are enforced

## Endpoints

### 1. Create Special Date

**POST** `/api/admin/clubs/[id]/special-dates`

Creates a new special date override for a club.

#### Request Body

```json
{
  "date": "2024-12-25",          // Required: ISO date string (YYYY-MM-DD)
  "isClosed": true,              // Required: boolean
  "openTime": "09:00",           // Required if isClosed is false, null otherwise
  "closeTime": "21:00",          // Required if isClosed is false, null otherwise
  "reason": "Christmas"          // Optional: string
}
```

#### Validation Rules

- `date` is required
- `isClosed` is required
- If `isClosed` is `false`, both `openTime` and `closeTime` are required
- `openTime` must be before `closeTime`
- Cannot create duplicate dates for the same club (409 Conflict)

#### Response

**Success (201 Created)**
```json
{
  "id": "uuid",
  "clubId": "club-123",
  "date": "2024-12-25T00:00:00.000Z",
  "openTime": null,
  "closeTime": null,
  "isClosed": true,
  "reason": "Christmas",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses**
- `400 Bad Request`: Invalid data (missing fields, invalid times)
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: No access to this club
- `404 Not Found`: Club not found
- `409 Conflict`: Date already exists for this club

---

### 2. Update Special Date

**PATCH** `/api/admin/clubs/[id]/special-dates/[dateId]`

Updates a specific special date override.

#### Request Body

Any of the following fields can be updated:

```json
{
  "date": "2024-12-26",          // Optional: ISO date string
  "isClosed": false,             // Optional: boolean
  "openTime": "10:00",           // Optional: HH:mm string
  "closeTime": "18:00",          // Optional: HH:mm string
  "reason": "Boxing Day"         // Optional: string
}
```

#### Validation Rules

- If `isClosed` is set to `false`, both `openTime` and `closeTime` must be provided
- `openTime` must be before `closeTime`
- If `date` is changed, the new date cannot conflict with existing special dates

#### Response

**Success (200 OK)**
```json
{
  "id": "uuid",
  "clubId": "club-123",
  "date": "2024-12-26T00:00:00.000Z",
  "openTime": "10:00",
  "closeTime": "18:00",
  "isClosed": false,
  "reason": "Boxing Day",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

**Error Responses**
- `400 Bad Request`: Invalid data
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: No access to this club
- `404 Not Found`: Special date or club not found
- `409 Conflict`: Date conflict with existing special date

---

### 3. Delete Special Date

**DELETE** `/api/admin/clubs/[id]/special-dates/[dateId]`

Deletes a specific special date override.

#### Response

**Success (200 OK)**
```json
{
  "success": true
}
```

**Error Responses**
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: No access to this club
- `404 Not Found`: Special date or club not found

---

### 4. Get Special Date

**GET** `/api/admin/clubs/[id]/special-dates/[dateId]`

Retrieves a specific special date override.

#### Response

**Success (200 OK)**
```json
{
  "id": "uuid",
  "clubId": "club-123",
  "date": "2024-12-25T00:00:00.000Z",
  "openTime": null,
  "closeTime": null,
  "isClosed": true,
  "reason": "Christmas",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses**
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: No access to this club
- `404 Not Found`: Special date not found

---

### 5. List Special Dates

**GET** `/api/admin/clubs/[id]/special-dates`

Lists all special dates for a club, ordered by date ascending.

#### Response

**Success (200 OK)**
```json
{
  "specialDates": [
    {
      "id": "uuid-1",
      "clubId": "club-123",
      "date": "2024-12-25T00:00:00.000Z",
      "openTime": null,
      "closeTime": null,
      "isClosed": true,
      "reason": "Christmas",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "uuid-2",
      "clubId": "club-123",
      "date": "2025-01-01T00:00:00.000Z",
      "openTime": "10:00",
      "closeTime": "18:00",
      "isClosed": false,
      "reason": "New Year's Day - Reduced Hours",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Responses**
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: No access to this club

---

## Authorization

All endpoints require authentication and authorization:

1. **Authentication**: User must be authenticated via `requireAnyAdmin`
2. **Authorization**: 
   - ROOT_ADMIN: Full access to all clubs
   - ORGANIZATION_ADMIN: Access to clubs in their organization
   - CLUB_ADMIN: Access to clubs they manage
   - CLUB_OWNER: Access to clubs they own

Authorization is enforced using the `canAccessClub` helper for non-root admins.

---

## Data Model

### ClubSpecialHours Table

```typescript
{
  id: string;              // UUID primary key
  clubId: string;          // Foreign key to Club
  date: DateTime;          // Date override applies to
  openTime: string | null; // HH:mm format or null if closed
  closeTime: string | null;// HH:mm format or null if closed
  isClosed: boolean;       // Whether the club is closed this day
  reason: string | null;   // Optional reason for the override
  createdAt: DateTime;     // Creation timestamp
  updatedAt: DateTime;     // Last update timestamp
}
```

**Constraints:**
- Unique constraint on `(clubId, date)` - prevents duplicate dates
- Index on `clubId` for faster lookups

---

## Frontend Integration

The frontend uses these endpoints through the `ClubSpecialDatesView` component:

1. **Loading**: Special dates are loaded with the club data
2. **Adding**: When user adds a date, it's marked with `_action: 'create'`
3. **Editing**: When user edits a date, it's marked with `_action: 'update'`
4. **Deleting**: When user removes a date, it's marked with `_action: 'delete'`
5. **Saving**: On save, appropriate API calls are made for each action

### Example Frontend Flow

```typescript
// User adds a new special date
const newDate = {
  date: "2024-12-25",
  isClosed: true,
  openTime: null,
  closeTime: null,
  reason: "Christmas",
  _action: 'create'  // Marked for creation
};

// User edits existing date
existingDate._action = 'update';  // Marked for update

// User deletes a date
dateToDelete._action = 'delete';  // Marked for deletion

// On save, frontend calls:
// - POST /api/admin/clubs/[id]/special-dates for 'create'
// - PATCH /api/admin/clubs/[id]/special-dates/[dateId] for 'update'
// - DELETE /api/admin/clubs/[id]/special-dates/[dateId] for 'delete'
```

---

## Migration from Old Endpoint

### Old Behavior (Deprecated)

**PATCH** `/api/admin/clubs/[id]/special-hours`

- Accepted array of all special hours
- Used `deleteMany` + `createMany` (destructive)
- Replaced all existing special dates

### New Behavior

- Individual CRUD operations
- Non-destructive
- Operates on single entities
- Better error handling and validation

The old endpoint is still available for backward compatibility but is no longer used by the frontend.

---

## Best Practices

1. **Always validate** `isClosed` with `openTime`/`closeTime` consistency
2. **Check for conflicts** before creating/updating dates
3. **Use Promise.allSettled** when processing multiple operations
4. **Provide clear error messages** for validation failures
5. **Fetch updated club data** after modifications to keep UI in sync

---

## Testing

Comprehensive tests cover:
- Authentication and authorization
- CRUD operations (create, read, update, delete, list)
- Validation (missing fields, invalid times, conflicts)
- Error cases (not found, forbidden, duplicate dates)

Run tests with:
```bash
npm test -- src/__tests__/special-dates-crud.test.ts
```
