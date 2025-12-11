# Club Admin Access Control - Security Implementation

## Overview

This document describes the implementation of enhanced access control for Club Admins to ensure they can only access pages and resources they are authorized to view and modify.

## Problem Statement

Previously, Club Admins could potentially access:
- Other clubs' admin pages (e.g., `/admin/clubs/:clubBId` when they only had access to clubA)
- Organization-level admin pages without organization admin privileges
- Edit/modify resources for clubs they didn't manage

## Solution

### 1. Enhanced Authorization Helpers

#### New Helper: `requireClubAccess`

Location: `src/lib/requireRole.ts`

```typescript
requireClubAccess(clubId: string, options?: { allowClubAdmin?: boolean })
```

This helper provides centralized authorization checking for club-scoped resources:

**Access Rules:**
- **Root Admin**: Can access any club (always authorized)
- **Organization Admin**: Can access clubs within their managed organization(s)
- **Club Admin**: Can access only their specific club (when `allowClubAdmin` is true)

**Options:**
- `allowClubAdmin`: When set to `false`, denies access to club admins (useful for edit/delete operations that should be restricted to root and org admins only)

**Returns:**
- On success: `{ authorized: true, userId, isRoot, accessType: "root" | "organization_admin" | "club_admin" }`
- On failure: `{ authorized: false, response: NextResponse, userId?: string }`

The helper also returns `userId` on failure to enable audit logging of unauthorized access attempts.

### 2. Updated API Routes

#### Club-Scoped Routes

All club-related API routes have been updated to use `requireClubAccess`:

**Read Access** (allows club admins):
- `GET /api/admin/clubs/[id]` - View club details
- `GET /api/admin/clubs/[id]/courts/[courtId]` - View court details

**Write Access** (root and org admins only):
- `PUT /api/admin/clubs/[id]` - Edit club
- `DELETE /api/admin/clubs/[id]` - Delete club
- `PATCH /api/admin/clubs/[id]/section` - Update club sections
- `PATCH /api/admin/clubs/[id]/courts/[courtId]` - Edit court
- `DELETE /api/admin/clubs/[id]/courts/[courtId]` - Delete court
- `POST /api/admin/clubs/[id]/images` - Upload club images
- `DELETE /api/admin/clubs/[id]/images/[imageId]` - Delete club images

**Admin Management** (root and org admins only):
- `GET /api/admin/clubs/[id]/admins` - List club admins
- `POST /api/admin/clubs/[id]/admins` - Add club admin
- `DELETE /api/admin/clubs/[id]/admins` - Remove club admin

#### Organization-Scoped Routes

Organization routes already correctly use `requireRootAdmin` - only platform root administrators can manage organizations.

### 3. Audit Logging

All unauthorized access attempts are logged to the `AuditLog` table with the following information:
- Actor ID (userId of the user attempting access)
- Action: `UNAUTHORIZED_ACCESS_ATTEMPT`
- Target Type: `CLUB` or `ORGANIZATION`
- Target ID: The ID of the resource being accessed
- Details: Path, HTTP method, and any relevant query parameters

This enables security monitoring and detection of potential unauthorized access patterns.

### 4. UI Guards

#### Club Detail Page

The club detail page (`/app/(pages)/admin/clubs/[id]/page.tsx`) has been enhanced with:

**Access Control:**
- Improved error handling for 403 responses
- Shows "Access denied — you are not authorized to view this club" message
- Prevents redirect to sign-in for authorization errors (vs authentication errors)

**Edit Permissions:**
- Added `canEdit` check based on admin type
- Only Root and Organization Admins can edit club details
- Club Admins can view but cannot modify

**Hidden UI Elements:**
- Publish/Unpublish button hidden for club admins
- Edit buttons in section views (Header, Contacts, Hours, Gallery, Coaches) hidden when user lacks edit permissions
- Delete button shown only to root admins

#### Component Updates

All club view components now support read-only mode:
- `ClubHeaderView`
- `ClubContactsView`
- `ClubHoursView`
- `ClubGalleryView`
- `ClubCoachesView`

These components accept an optional `onUpdate` prop. When `undefined`, edit buttons are automatically hidden.

## Security Benefits

1. **Server-Side Enforcement**: All authorization checks happen on the server, preventing client-side bypass
2. **Centralized Logic**: Single source of truth for club access rules in `requireClubAccess`
3. **Audit Trail**: All unauthorized access attempts are logged for security monitoring
4. **Defense in Depth**: Both API and UI enforce access controls
5. **Principle of Least Privilege**: Club admins can only access what they need

## Testing Recommendations

### Manual Testing Scenarios

1. **Club Admin Accessing Own Club**
   - Login as club admin for Club A
   - Navigate to `/admin/clubs/:clubA`
   - Expected: Can view all details
   - Expected: Cannot see Edit buttons or modify content

2. **Club Admin Accessing Other Club**
   - Login as club admin for Club A
   - Try to access `/admin/clubs/:clubB`
   - Expected: API returns 403
   - Expected: UI shows "Access denied" message

3. **Organization Admin Accessing Clubs in Their Org**
   - Login as org admin for Organization X
   - Access any club belonging to Organization X
   - Expected: Full access (view and edit)

4. **Organization Admin Accessing Clubs in Other Org**
   - Login as org admin for Organization X
   - Try to access club belonging to Organization Y
   - Expected: 403 Forbidden

5. **Root Admin**
   - Login as root admin
   - Expected: Full access to all clubs

### Integration Test Scenarios

```typescript
// Test cases for /api/admin/clubs/:id
describe('Club Access Control', () => {
  test('Club Admin A → GET /admin/clubs/:clubA → 200', ...);
  test('Club Admin A → GET /admin/clubs/:clubB → 403', ...);
  test('Club Admin → PUT /admin/clubs/:clubA → 403', ...);
  test('Organization Admin → GET clubs in org → 200', ...);
  test('Organization Admin → PUT clubs in org → 200', ...);
  test('Root Admin → access all clubs → 200', ...);
});
```

## Migration Notes

### Changed Files

**Authorization Helpers:**
- `src/lib/requireRole.ts` - Added `requireClubAccess` helper
- `src/lib/auditLog.ts` - Added `UNAUTHORIZED_ACCESS_ATTEMPT` action

**API Routes:**
- `src/app/api/admin/clubs/[id]/route.ts`
- `src/app/api/admin/clubs/[id]/section/route.ts`
- `src/app/api/admin/clubs/[id]/courts/[courtId]/route.ts`
- `src/app/api/admin/clubs/[id]/admins/route.ts`
- `src/app/api/admin/clubs/[id]/images/route.ts`
- `src/app/api/admin/clubs/[id]/images/[imageId]/route.ts`

**UI Pages:**
- `src/app/(pages)/admin/clubs/[id]/page.tsx`

**UI Components:**
- `src/components/admin/club/ClubHeaderView.tsx`
- `src/components/admin/club/ClubContactsView.tsx`
- `src/components/admin/club/ClubHoursView.tsx`
- `src/components/admin/club/ClubGalleryView.tsx`
- `src/components/admin/club/ClubCoachesView.tsx`

### Backward Compatibility

All changes are backward compatible:
- Root admins maintain full access
- Organization admins maintain access to clubs in their organizations
- Club admins now have appropriate read-only access to their clubs
- No breaking changes to API contracts

## Future Enhancements

1. **Rate Limiting**: Add rate limiting for unauthorized access attempts to prevent brute-force attacks
2. **Alerting**: Set up automated alerts for repeated unauthorized access attempts
3. **Session Invalidation**: Consider invalidating sessions after multiple unauthorized attempts
4. **Granular Permissions**: Consider adding more fine-grained permissions (e.g., VIEW_ONLY_CLUB_ADMIN role)
5. **UI Navigation Guards**: Update AdminSidebar to dynamically hide links based on user permissions

## References

- Authorization patterns: `src/lib/requireRole.ts`
- Audit logging: `src/lib/auditLog.ts`
- Role constants: `src/constants/roles.ts`
- Copilot settings: `.github/copilot-settings.md`
