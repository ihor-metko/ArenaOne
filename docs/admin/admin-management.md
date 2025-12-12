# Admin Management

This document describes the admin management functionality in the ArenaOne platform, including how to manage Organization Admins and Club Admins.

## Overview

The admin management system provides a centralized way to:
- Manage Organization-level administrators (Owner and Organization Admins)
- Manage Club-level administrators (Club Admins)
- Control access and permissions across the platform

## Admin Roles

### 1. Root Admin
- Platform super-user with access to all organizations and clubs
- Can perform any administrative action
- Not tied to any specific organization

### 2. Organization Admin (Owner)
- Primary owner of an organization
- Has full control over the organization and all its clubs
- Can manage other Organization Admins
- Can manage Club Admins within their organization
- Only one primary owner per organization

### 3. Organization Admin
- Administrator of a specific organization
- Can manage Club Admins within their organization
- Can manage organization settings
- Cannot remove or change the primary owner

### 4. Club Admin
- Administrator of a specific club
- Can manage club settings, courts, and bookings
- Can be assigned to multiple clubs
- Managed by Organization Admins or Root Admin

## Organization Detail Page - Admin Management

The Organization Detail page (`/admin/organizations/[orgId]`) displays two main sections for admin management:

### Organization Admins Section

Displays all organization-level administrators (Owner + Organization Admins) with:
- **Columns**: Name, Email, Role (Owner/Organization Admin), Last Login, Actions
- **Permissions**: Only Root Admin can manage organization admins

**Available Actions:**
1. **Add Admin**
   - Add existing user as Organization Admin
   - Create new user and assign as Organization Admin
   - First admin automatically becomes the primary owner

2. **Change Owner**
   - Transfer primary ownership to another Organization Admin
   - Previous owner becomes a regular Organization Admin
   - Only Root Admin can change ownership

3. **Remove Admin**
   - Remove Organization Admin role from user
   - Cannot remove primary owner (must transfer ownership first)
   - Confirms before deletion

### Club Admins Section

Displays all Club Admins within the organization with:
- **Columns**: Name, Email, Club (name), Last Login, Actions
- **Permissions**: Root Admin or Organization Admin can manage club admins

**Available Actions:**
1. **Add Club Admin**
   - Assign existing user as Club Admin to a club
   - Invite new user by email (creates pending user account)
   - Select which club to assign the admin to

2. **Edit Club Admin**
   - Reassign Club Admin to a different club within the same organization
   - Supports users with multiple club admin assignments

3. **Remove Club Admin**
   - Remove Club Admin role from user for specific club
   - User may still have other club admin assignments
   - Confirms before deletion

## API Endpoints

### Organization Admins

#### GET /api/orgs/[orgId]/admins
Get all admins (Organization Admins and Club Admins) for an organization.

**Authorization**: Root Admin or Organization Admin

**Response**:
```json
{
  "superAdmins": [
    {
      "id": "membership-id",
      "type": "superadmin",
      "userId": "user-id",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "isPrimaryOwner": true,
      "lastLoginAt": "2024-12-12T12:00:00Z",
      "createdAt": "2024-01-01T12:00:00Z"
    }
  ],
  "clubAdmins": [
    {
      "id": "membership-id",
      "type": "clubadmin",
      "userId": "user-id",
      "userName": "Jane Smith",
      "userEmail": "jane@example.com",
      "lastLoginAt": "2024-12-12T10:00:00Z",
      "clubs": [
        {
          "id": "club-id",
          "name": "Club A",
          "membershipId": "club-membership-id"
        }
      ],
      "createdAt": "2024-01-02T12:00:00Z"
    }
  ],
  "summary": {
    "totalSuperAdmins": 1,
    "totalClubAdmins": 1,
    "totalClubs": 5
  }
}
```

#### POST /api/admin/organizations/assign-admin
Assign or create a user as Organization Admin.

**Authorization**: Root Admin only

**Request Body (Existing User)**:
```json
{
  "organizationId": "org-id",
  "createNew": false,
  "userId": "user-id",
  "setAsPrimaryOwner": false
}
```

**Request Body (New User)**:
```json
{
  "organizationId": "org-id",
  "createNew": true,
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure-password",
  "setAsPrimaryOwner": false
}
```

#### POST /api/admin/organizations/remove-admin
Remove an Organization Admin.

**Authorization**: Root Admin or Primary Owner

**Request Body**:
```json
{
  "organizationId": "org-id",
  "userId": "user-id"
}
```

**Validation**:
- Cannot remove primary owner (must transfer ownership first)
- Primary owner cannot remove themselves

#### PATCH /api/admin/organizations/set-owner
Change the primary owner of an organization.

**Authorization**: Root Admin or Primary Owner

**Request Body**:
```json
{
  "organizationId": "org-id",
  "userId": "new-owner-user-id"
}
```

**Validation**:
- Target user must already be an Organization Admin
- Only one primary owner allowed per organization

### Club Admins

#### GET /api/orgs/[orgId]/club-admins
Get all Club Admins for an organization.

**Authorization**: Root Admin or Organization Admin

**Response**:
```json
[
  {
    "id": "club-membership-id",
    "userId": "user-id",
    "userName": "Jane Smith",
    "userEmail": "jane@example.com",
    "clubId": "club-id",
    "clubName": "Club A",
    "createdAt": "2024-01-02T12:00:00Z"
  }
]
```

#### POST /api/orgs/[orgId]/club-admins
Assign a Club Admin to a club.

**Authorization**: Root Admin or Organization Admin

**Request Body (Existing User)**:
```json
{
  "userId": "user-id",
  "clubId": "club-id"
}
```

**Request Body (Invite User)**:
```json
{
  "email": "new-admin@example.com",
  "name": "New Admin",
  "clubId": "club-id"
}
```

**Validation**:
- Club must belong to the organization
- User cannot already be Club Admin of the same club

#### PUT /api/orgs/[orgId]/club-admins/[clubAdminId]
Update a Club Admin's club assignment.

**Authorization**: Root Admin or Organization Admin

**Request Body**:
```json
{
  "clubId": "new-club-id"
}
```

**Validation**:
- New club must belong to the same organization
- User cannot already be Club Admin of the target club

#### DELETE /api/orgs/[orgId]/club-admins/[clubAdminId]
Remove a Club Admin.

**Authorization**: Root Admin or Organization Admin

## Permission Model

### Authorization Rules

1. **Root Admin**
   - Can perform any action on any organization or club
   - Not restricted by organization membership

2. **Organization Owner (Primary Owner)**
   - Full control over their organization
   - Can add/remove Organization Admins (except themselves)
   - Can transfer ownership to another Organization Admin
   - Can manage all Club Admins within their organization

3. **Organization Admin**
   - Can manage Club Admins within their organization
   - Cannot manage other Organization Admins
   - Cannot change organization ownership

4. **Club Admin**
   - Can manage their assigned club(s)
   - Cannot manage other admins
   - Cannot access organization-level settings

### Server-Side Checks

All admin management operations are protected by server-side authorization checks:
- `requireRootAdmin()` - Root Admin only
- `requireOrganizationAdmin(orgId)` - Root Admin or Organization Admin
- `requireClubAdminManagement(orgId)` - Root Admin or Organization Admin

### Client-Side Permission Checks

The UI only displays actions that the current user is allowed to perform:
```typescript
// Organization Admin management (Root Admin only)
const canManageAdmins = isRoot;

// Club Admin management (Root Admin or Org Admin)
const canManageClubAdmins = isRoot || isOrgAdmin(orgId);
```

## Audit Logging

All admin management actions are logged in the AuditLog table:
- Admin assignment/creation
- Admin removal
- Ownership transfer
- Role changes

## UI Components

### OrganizationAdminsTable
Located at: `src/components/admin/OrganizationAdminsTable.tsx`

Features:
- Displays organization admins with role badges
- Add admin modal (existing user or new user)
- Change owner modal
- Remove admin confirmation modal
- Toast notifications for all actions

### ClubAdminsTable
Located at: `src/components/admin/ClubAdminsTable.tsx`

Features:
- Displays club admins with club badges
- Add club admin modal (existing user or invite)
- Edit modal to reassign club
- Remove admin confirmation modal
- Supports users with multiple club assignments
- Toast notifications for all actions

## Translations

### Organization Admins
Located in `locales/en.json` under `orgAdmins`:
- `addAdmin`, `removeAdmin`, `changeOwner`
- `owner`, `orgAdmin`, `role`, `lastLogin`
- `adminAdded`, `adminRemoved`, `ownerChanged`
- Modal and form labels

### Club Admins
Located in `locales/en.json` under `clubAdmins`:
- `addAdmin`, `editAdmin`, `removeAdmin`
- `club`, `selectClub`, `reassignToClub`
- `adminAdded`, `adminUpdated`, `adminRemoved`
- `existingUser`, `inviteUser`
- Modal and form labels

## Error Handling

Common error scenarios:
1. **Duplicate membership**: User is already an admin
2. **Invalid club**: Club does not belong to organization
3. **Unauthorized**: User lacks permission to perform action
4. **Primary owner removal**: Cannot remove owner without transferring ownership first
5. **Self-removal**: Owner cannot remove themselves

All errors are:
- Validated server-side with appropriate HTTP status codes (400, 403, 409)
- Displayed to users via toast notifications
- Logged for debugging (in development mode)

## Best Practices

1. **Always transfer ownership** before removing a primary owner
2. **Use invite flow** for new users to avoid password management
3. **Review permissions** regularly to maintain security
4. **Audit logs** are your friend for troubleshooting
5. **Test permission checks** on both frontend and backend
6. **Handle edge cases** like users with multiple roles

## Future Enhancements

Potential improvements:
- Bulk admin assignment
- Admin invitation emails with links
- Admin activity dashboard
- Fine-grained permissions for Organization Admins
- Role-based access control (RBAC) expansion
- Admin approval workflow
