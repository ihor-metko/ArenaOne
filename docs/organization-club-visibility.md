# Organization and Club Visibility Logic

## Overview

This document describes the visibility rules for organizations and clubs in the ArenaOne platform.

## Visibility Rules

### Organizations

- Organizations have an `isPublic` field that determines their publication status
- When `isPublic = false`, the organization is **unpublished** and hidden from public view
- When `isPublic = true`, the organization is **published** and visible publicly

### Clubs

Clubs follow a hierarchical visibility model based on their parent organization:

1. **If the organization is unpublished (`isPublic = false`)**:
   - All clubs belonging to that organization are hidden from public view
   - This applies even if individual clubs have `isPublic = true`
   
2. **If the organization is published (`isPublic = true`)**:
   - Only clubs with `isPublic = true` are visible publicly
   - Clubs with `isPublic = false` remain hidden

### Summary Table

| Organization Status | Club Status | Public Visibility |
|-------------------|-------------|------------------|
| Unpublished       | Unpublished | ❌ Hidden         |
| Unpublished       | Published   | ❌ Hidden         |
| Published         | Unpublished | ❌ Hidden         |
| Published         | Published   | ✅ Visible        |

## Implementation

### Backend (API)

The visibility rules are enforced in the following public API endpoints:

#### `/api/(player)/clubs` - List all clubs
```typescript
whereClause.isPublic = true;
whereClause.organization = {
  isPublic: true,
};
```

#### `/api/(player)/clubs/[id]` - Get club details
```typescript
// Check visibility: club must be public AND organization must be public
if (!club.isPublic || !club.organization.isPublic) {
  return NextResponse.json({ error: "Club not found" }, { status: 404 });
}
```

### Frontend

The organization detail page displays the publication status prominently:
- Banner shows status badge (Published/Unpublished/Archived)
- Edit buttons for logo, banner, and publication toggle (admin only)
- Publication toggle updates the organization's `isPublic` status

### Admin Access

Admin endpoints (`/api/admin/clubs`, `/api/orgs/[orgId]/clubs`) show all clubs regardless of publication status, allowing administrators to manage unpublished content.

## User Permissions

### Who can publish/unpublish organizations?

- **Root Admin**: Full access to all organizations
- **Organization Owner**: Can manage their organization
- **Organization Admin**: Can manage their organization

### Who can publish/unpublish clubs?

- **Root Admin**: Full access to all clubs
- **Organization Admin**: Can manage clubs in their organization
- **Club Admin**: Can manage their specific club

## UI Indicators

- **Published**: Green badge, accessible to public
- **Unpublished**: Yellow/orange badge, hidden from public
- **Archived**: Gray badge, completely hidden (organizations only)

## Related Files

- `/src/app/api/(player)/clubs/route.ts` - Public clubs list API
- `/src/app/api/(player)/clubs/[id]/route.ts` - Public club detail API
- `/src/app/(pages)/admin/organizations/[orgId]/page.tsx` - Organization detail page
- `/src/app/api/orgs/[orgId]/route.ts` - Organization update API
- `/src/types/organization.ts` - Organization type definitions
