# Organization Detail Page Implementation

## Overview
The Organization Detail Page provides comprehensive management capabilities for organizations within the RSP platform. This feature allows administrators to view, manage, and monitor organization data, clubs, users, and activities.

## Page Location
- **Route**: `/admin/organizations/[orgId]`
- **File**: `src/app/(pages)/admin/organizations/[orgId]/page.tsx`

## Features Implemented

### 1. UI Components

#### OrganizationHeader
- Displays organization name, slug, status (archived/active)
- Shows primary owner (SuperAdmin)
- Displays creation date and last updated timestamp
- Shows contact information (email, phone, website, address)
- Status badge indicating if organization is archived

#### OrganizationStats (Key Metrics)
Displays real-time metrics:
- Total Clubs
- Total Courts (across all clubs)
- Active Bookings
- Active Users

#### ClubsList
- Shows preview of first 5 clubs
- Displays club name, location, court count
- Shows published/draft status
- Provides navigation to individual club detail pages
- "View All Clubs" button when more than 5 clubs exist

#### AdminsList
Two sections:
1. **Super Admins**: Organization-level administrators
   - Shows name, email
   - Highlights primary owner with badge
   - Avatar with user initials

2. **Club Admins**: Club-level administrators
   - Shows name, email, and associated club
   - Avatar with user initials

#### Users Preview
- Shows first 5 users with bookings
- Displays summary: total users and active today
- Shows last booking date for each user

#### Activity Feed
- Recent audit log entries (last 10 actions)
- Shows action type, actor, and timestamp
- Actions include:
  - Organization create/update/archive/delete
  - Owner reassignment
  - Admin assignment/removal

#### ActionsPanel
**Edit Organization**:
- Update name, slug
- Update contact information (email, phone, website, address)
- Modal-based editing with validation

**Manage Admins** (Root Admin only):
- Reassign primary owner
- Two modes: existing user or create new user
- Search functionality for existing users

**Archive Organization** (Root Admin only):
- Soft delete with confirmation
- Preserves data for potential recovery

**Delete Organization** (Root Admin only):
- Permanent deletion with double confirmation
- Requires typing organization slug to confirm
- Warns if clubs or bookings exist

### 2. Backend API Implementation

#### Main Endpoint: `GET /api/orgs/[orgId]`
**Authorization**:
- Root Admin: full access to all organizations
- Organization Admin (SuperAdmin): access only to their organization
- Other users: 403 Forbidden

**Response Includes**:
- Organization details (name, slug, contact info)
- Created by user information
- List of super admins with primary owner flag
- Key metrics (clubs, courts, bookings, users)
- Preview of first 5 clubs with details
- Club admins list
- Recent activity log with actor information (Fixed)

#### Update Endpoint: `PUT /api/orgs/[orgId]`
- Update organization metadata
- Auto-generates slug from name if not provided
- Validates slug uniqueness
- Creates audit log entry

#### Delete Endpoint: `DELETE /api/admin/organizations/[id]`
- Root Admin only
- Requires slug confirmation if clubs exist
- Checks for active bookings
- Cascading delete of related data

#### Archive Endpoint: `POST /api/orgs/[orgId]/archive`
- Root Admin only
- Soft delete (sets archivedAt timestamp)
- Prevents further updates

#### Reassign Owner: `POST /api/orgs/[orgId]/reassign-superadmin`
- Root Admin only
- Transfer primary owner role
- Support for existing or new user
- Creates audit log entry

#### Additional Endpoints
- `GET /api/orgs/[orgId]/clubs` - Full clubs list with pagination
- `GET /api/orgs/[orgId]/admins` - Detailed admins list
- `GET /api/orgs/[orgId]/activity` - Activity log with pagination
- `GET /api/orgs/[orgId]/users` - Users preview with booking data
- `GET /api/orgs/[orgId]/club-admins` - Club admins management

### 3. Role-Based Access Control

**Root Admin** (isRoot = true):
- Full access to all organizations
- Can edit any organization
- Can reassign owners
- Can archive organizations
- Can delete organizations

**Organization Admin** (ORGANIZATION_ADMIN role):
- Access only to their own organization
- Can edit organization details
- Can view all data
- Cannot delete or archive
- Cannot reassign primary owner

**Other Users**:
- No access (403 Forbidden)
- Redirected to sign-in page

### 4. UX Features

**Loading States**:
- Skeleton loading animation
- Prevents UI flicker during data fetch

**Error Handling**:
- 403 error page for unauthorized access
- 404 error page for non-existent organizations
- Toast notifications for all actions
- Inline error messages in modals

**Confirmation Modals**:
- Edit organization information
- Reassign primary owner with warning
- Archive confirmation
- Delete with slug confirmation
- Warns about clubs/bookings before deletion

**Toast Notifications**:
- Success messages for all actions
- Error messages with details
- Auto-dismiss after 5 seconds

**Dark Theme**:
- All components use `im-*` semantic CSS classes
- Consistent with platform design system
- Accessible color contrast

### 5. Testing

#### Backend Tests (`src/__tests__/org-detail-api.test.ts`)
18 tests covering:
- Authentication and authorization checks
- GET endpoint for root and org admins
- PUT endpoint for updates
- Archive functionality
- Owner reassignment
- Clubs, admins, activity, and users endpoints
- Error cases (404, 403, 401, 400)

#### Test Results
All 89 organization-related tests passing:
- `admin-organizations.test.ts`
- `org-dashboard-page.test.tsx`
- `org-dashboard-api.test.ts`
- `admin-organization-card.test.tsx`
- `org-detail-api.test.ts`

## Recent Fixes

### Activity Log Actor Information
**Issue**: The main GET endpoint was returning only `actorId` instead of full actor information for activity logs.

**Fix**: Added actor resolution in the GET endpoint to match the standalone activity endpoint:
- Fetches user details for all actors in the activity log
- Returns actor object with id, name, and email
- Handles missing actors gracefully
- Updated tests to mock `prisma.user.findMany`

**Files Modified**:
- `src/app/api/orgs/[orgId]/route.ts`
- `src/__tests__/org-detail-api.test.ts`

## Technical Details

### Database Schema
Organizations are linked to:
- Users (via memberships)
- Clubs (via organizationId)
- Audit logs (for activity tracking)

### Audit Logging
All critical actions are logged:
- `org.create` - Organization creation
- `org.update` - Organization updates
- `org.archive` - Organization archival
- `org.delete` - Organization deletion
- `org.reassign_owner` - Owner reassignment
- `org.assign_admin` - Admin assignment
- `org.remove_admin` - Admin removal

### Performance Considerations
- Parallel queries using `Promise.all` for metrics
- Preview lists limited to 5 items initially
- Pagination support for full lists
- Efficient database queries with proper includes

## Related Documentation
- [Copilot Settings](.github/copilot-settings.md) - Project-level coding rules
- [RBAC Tests](src/__tests__/rbac.test.ts) - Role-based access control tests
- [Organizations Card Layout](docs/ORGANIZATIONS_CARD_LAYOUT.md)

## Future Enhancements
Potential areas for expansion:
- Organization billing and subscription management
- Advanced analytics and reporting
- Bulk operations for clubs
- Organization-level settings
- Custom branding per organization
- Multi-organization user management
