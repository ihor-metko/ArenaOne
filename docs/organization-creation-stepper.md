# Organization Creation Stepper Implementation

## Overview

This document describes the implementation of the 5-step organization creation stepper that was added to the ArenaOne platform. The stepper provides a comprehensive and user-friendly flow for creating new organizations with all necessary details.

## Implementation Date

December 16, 2024

## Components Modified

### Frontend Components

- **OrganizationCreationStepper.client.tsx** - Main stepper component implementing all 5 steps
  - Location: `src/components/admin/OrganizationCreationStepper.client.tsx`
  - Purpose: Provides a guided multi-step form for creating organizations

### Backend API Routes

- **organizations/route.ts** - POST endpoint updated to handle new fields
  - Location: `src/app/api/admin/organizations/route.ts`
  - Changes: Added support for description, address components, social media, and metadata

### Types

- **organization.ts** - Updated CreateOrganizationPayload
  - Location: `src/types/organization.ts`
  - Changes: Added description field to payload interface

### Mock Services (for development)

- **mockDb.ts** - Updated createMockOrganization function
- **mockApiHandlers.ts** - Updated mockCreateOrganizationHandler

## Stepper Flow

### Step 1: Basic Information & Description (Mandatory)

**Fields:**
- Organization Name * (required)
- Slug (optional, auto-generated from name)
- Short Description / Bio * (required)

**Validation:**
- Name must not be empty
- Description must not be empty
- Slug is auto-generated if not provided

### Step 2: Organization Address (Mandatory)

**Fields:**
- Country * (required)
- City * (required)
- Street * (required)
- Postal Code (optional)
- Latitude * (required, number with range -90 to 90)
- Longitude * (required, number with range -180 to 180)

**Validation:**
- All fields except postal code are required
- Latitude must be between -90 and 90
- Longitude must be between -180 and 180
- Coordinates must be valid numbers

**Notes:**
- Users should use a map service (e.g., Google Maps) to find accurate coordinates
- Address is constructed from components and stored as a single field
- Geographic coordinates are validated for valid bounds

### Step 3: Contacts & Website / Social Media (Optional)

**Fields:**
- Organization Email (optional, email validation)
- Phone Number (optional)
- Website (optional)
- Facebook URL (optional)
- Instagram URL (optional)
- LinkedIn URL (optional)

**Validation:**
- Email must match valid email format if provided
- All fields are optional

### Step 4: Images & Logo (Hero Image Mandatory)

**Fields:**
- Organization Logo (optional)
- Background Image / Banner * (required)

**Features:**
- Drag-and-drop or click to upload
- Image preview before submission
- File type validation (JPG, PNG, WebP)
- File size limit (5MB)
- Aspect ratio guidance (square for logo, wide for banner)

**Validation:**
- Hero/banner image is required
- Logo is optional

### Step 5: Assign Owner / SuperAdmin (Optional)

**Options:**
1. Skip owner assignment (can be done later)
2. Assign existing user:
   - Search users by name or email (debounced search)
   - Select from search results
3. Create new user:
   - Name * (required)
   - Email * (required, email validation)
   - Password * (required, minimum 8 characters)

**Features:**
- User search with 300ms debouncing to prevent excessive API calls
- Automatic SuperAdmin role assignment
- Primary owner designation

**Validation:**
- If assigning owner:
  - Existing user: Must select a user from search
  - New user: Name, valid email, and password (8+ chars) required

## Data Storage

### Direct Database Fields

The following fields are stored directly in the Organization table:
- `name` - Organization name
- `slug` - URL-friendly identifier
- `description` - Short description/bio
- `contactEmail` - Contact email
- `contactPhone` - Contact phone
- `website` - Website URL
- `address` - Full address (constructed from components)

### Metadata Field (JSON)

The following data is stored in the `metadata` JSON field:
- `country` - Country name
- `street` - Street address
- `latitude` - Geographic latitude (number)
- `longitude` - Geographic longitude (number)
- `socialLinks` - Object containing:
  - `facebook` - Facebook URL (if provided)
  - `instagram` - Instagram URL (if provided)
  - `linkedin` - LinkedIn URL (if provided)
- `logo` - Logo URL or preview (if provided)
- `heroImage` - Banner/hero image URL or preview

### Example Metadata Structure

```json
{
  "country": "Ukraine",
  "street": "Main Street 123",
  "latitude": 50.4501,
  "longitude": 30.5234,
  "socialLinks": {
    "facebook": "https://facebook.com/org",
    "instagram": "https://instagram.com/org",
    "linkedin": "https://linkedin.com/company/org"
  },
  "logo": "https://...",
  "heroImage": "https://..."
}
```

## Owner Assignment Flow

When the user opts to assign an owner (Step 5):

1. **For Existing User:**
   - POST request to `/api/admin/organizations/assign-admin`
   - Payload includes: `organizationId`, `userId`, `createNew: false`, `setAsPrimaryOwner: true`

2. **For New User:**
   - POST request to `/api/admin/organizations/assign-admin`
   - Payload includes: `organizationId`, `createNew: true`, `name`, `email`, `password`, `setAsPrimaryOwner: true`
   - API creates the user and assigns SuperAdmin role

3. **Skip:**
   - Organization is created without an owner
   - Owner can be assigned later from organization detail page

## UI/UX Features

### Progress Indication
- Visual stepper indicator showing current step
- Step numbers with labels
- Completed steps marked with checkmark
- Progress text showing "Step X of 5"

### Navigation
- Back button (available after Step 1)
- Next button (Steps 1-4)
- Create Organization button (Step 5)
- Cancel button (returns to organizations list)

### Validation & Feedback
- Real-time field validation
- Error messages displayed below fields
- Global error banner for submission errors
- Success toast notification on creation
- Automatic redirect to organization detail page after success

### Accessibility
- Proper label associations
- ARIA attributes for dynamic content
- Keyboard navigation support
- Screen reader friendly

## Code Quality

### Linting
- All ESLint rules passing for modified files
- No TypeScript compilation errors
- Consistent with project code style

### Security
- CodeQL security scan passed with 0 vulnerabilities
- Input validation on frontend and backend
- SQL injection prevention via Prisma ORM
- XSS prevention through React's built-in escaping

### Testing
- Organization store tests: 29/29 passing
- API routes tested with existing test suite
- Mock handlers updated for development testing

## Future Enhancements

1. **Map Picker Component**
   - Interactive map for selecting coordinates
   - Address geocoding to auto-fill coordinates
   - Visual confirmation of location

2. **Enhanced Image Handling**
   - Integration with cloud storage (S3, Cloudinary, etc.)
   - Image optimization and resizing
   - Multiple image formats support

3. **Social Media Validation**
   - URL format validation for each platform
   - Preview of social media profiles
   - Link verification

4. **Address Autocomplete**
   - Integration with Google Places API
   - Auto-fill city, postal code, and coordinates
   - Address validation

5. **Draft Saving**
   - Save incomplete forms as drafts
   - Resume creation from where user left off
   - Auto-save functionality

## Migration Notes

No database migrations are required as this implementation uses existing fields in the Organization model:
- `description` field already exists in schema
- `metadata` field (TEXT/JSON) already exists for flexible data storage
- All other fields (`contactEmail`, `contactPhone`, `website`, `address`) already exist

## Usage Example

```typescript
// Frontend - Creating an organization with all fields
const submitData = {
  name: "Tech Arena",
  slug: "tech-arena",
  description: "A modern technology organization",
  address: "Main Street 123, Kyiv, 01001 Ukraine",
  contactEmail: "info@tech-arena.com",
  contactPhone: "+380501234567",
  website: "https://tech-arena.com",
  metadata: {
    country: "Ukraine",
    street: "Main Street 123",
    latitude: 50.4501,
    longitude: 30.5234,
    socialLinks: {
      facebook: "https://facebook.com/techarena",
      instagram: "https://instagram.com/techarena",
      linkedin: "https://linkedin.com/company/techarena"
    },
    logo: "...",
    heroImage: "..."
  }
};

const organization = await createOrganization(submitData);
```

## Related Files

- `src/components/admin/OrganizationCreationStepper.client.tsx` - Main component
- `src/components/admin/ClubCreationStepper.css` - Shared styles
- `src/components/admin/UploadField.client.tsx` - Image upload component
- `src/app/api/admin/organizations/route.ts` - API endpoint
- `src/app/api/admin/organizations/assign-admin/route.ts` - Owner assignment API
- `src/types/organization.ts` - TypeScript types
- `src/stores/useOrganizationStore.ts` - State management

## Support

For questions or issues related to the organization creation stepper, please refer to:
- This documentation
- Code comments in the implementation files
- Existing test files for usage examples
