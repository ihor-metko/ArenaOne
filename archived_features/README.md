# Archived Features

This folder is designated for storing non-essential features, pages, and components that are not required for the current MVP (Minimum Viable Product) release.

## Purpose

The `archived_features` folder helps keep the MVP clean, lightweight, and focused on core functionality. Features stored here may include:

- Experimental or unfinished pages/components
- Features planned for future releases (e.g., analytics, advanced search, reports, extended filters, gamification)
- Deprecated UI components or old styles
- Integrations not required for MVP

## Current MVP Features (Not to be archived)

The following features are essential for the MVP and should remain in the main codebase:

### Player Features
- Club list display and club details
- Court list display and court availability
- Quick Booking and BookingModal functionality
- Player dashboard with club and court availability
- Training requests with coaches
- Training history

### Coach Features
- Coach dashboard
- Weekly availability management
- Time off management
- Training request handling (confirm/reject)
- Coach bookings page

### Admin Features
- Clubs CRUD (Create, Read, Update, Delete)
- Courts CRUD with price rules
- Coach management and assignment to clubs
- Notifications system
- User role management

### System Features
- Authentication (sign-in, sign-up)
- Role-based access control (player, coach, admin)
- Multilingual support (English, Ukrainian)
- Dark/Light theme support using CSS variables (--rsp-*)

## Folder Structure

When archiving features, organize them by type:

```
archived_features/
├── README.md              # This file
├── components/            # Archived React components
├── pages/                 # Archived page components
├── api/                   # Archived API routes
├── hooks/                 # Archived custom hooks
├── lib/                   # Archived library utilities
└── styles/                # Archived CSS/style files
```

## How to Archive Features

1. Identify the feature files to archive
2. Move them to the appropriate subfolder within `archived_features`
3. Update any imports in the MVP code to avoid broken references
4. Document the archived feature in this README with:
   - Feature name
   - Reason for archiving
   - Date archived
   - Files included

## Currently Archived Features

*No features are currently archived. The existing codebase is MVP-ready.*

---

## Re-activating Archived Features

To re-activate an archived feature for a future release:

1. Move the files back to their original locations in `src/`
2. Restore any necessary imports
3. Update tests if needed
4. Remove the feature from the "Currently Archived Features" list above
5. Test thoroughly before deploying

## Notes

- Always test the MVP after archiving or re-activating features
- Keep this README updated when archiving new features
- Consider creating feature flags for gradual rollouts instead of full archival
