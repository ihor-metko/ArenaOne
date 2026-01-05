# Player Mobile Flow – Specification & Rules

## Overview

This document defines the **single source of truth** for implementing the mobile-first player flow in ArenaOne. It serves as the foundation for all future player-related development tasks.

**Important**: This document must be referenced and followed before implementing any player-related features, UI components, or booking logic.

---

## Platform Context

ArenaOne is a **multi-club SaaS platform** for managing padel clubs with the following characteristics:

### Platform Hierarchy

```
Root Admin
  └── Organization(s)
      └── Club(s)
          └── Court(s)
              └── Booking(s)
```

### Platform Roles

- **Admin Roles**: ROOT_ADMIN, ORGANIZATION_ADMIN, CLUB_ADMIN
- **Player Role**: Regular users who book courts and view clubs

### Scope of This Document

This document applies **ONLY to the player role** and player-facing features.

- Players and admins use the same platform but see different interfaces
- Admin users **never** see public player landing pages or player flows
- Players do not have access to admin dashboards or management features

---

## Player Rules (Hard Constraints)

These rules are **non-negotiable** and must be enforced at all times:

### 1. Court Visibility Rules

- **Players never see unpublished courts**
  - A court is visible only if `isPublic = true`
  - Unpublished courts (`isPublic = false`) must not appear in any player-facing view

### 2. Club Visibility Rules

- **Clubs without published courts are not visible to players**
  - A club is visible only if:
    - The club has `isPublic = true`
    - The parent organization has `isPublic = true`
    - The club has at least one published court (`isPublic = true`)
  - If a club has zero published courts, it must not appear in the club list

### 3. Quick Booking Availability

- **Quick booking is available only if published courts exist**
  - Players can access quick booking only for clubs with at least one published court
  - If no published courts exist, quick booking should not be offered

### 4. Empty State Handling

- **If no courts exist → explicit empty-state must be shown**
  - When viewing a club with no published courts, show a clear message
  - Do not show broken UI, loading states, or misleading availability
  - Empty state must indicate that no courts are currently available

### 5. Admin Separation

- **Admin users never see public player landing or player flows**
  - Admins are redirected to admin dashboards
  - Player landing pages, club lists, and availability views are for players only
  - Admin components and player components must not be mixed

---

## UX Constraints

All player-facing features must follow these UX principles:

### Mobile-First Only

- **Desktop patterns are forbidden**
- Design and implement for mobile screens first (320px - 768px)
- All interfaces must be optimized for touch interaction
- Responsive behavior should scale up, not down

### Step-Based Navigation

- **No dense grids or multi-column layouts**
- Use step-by-step flows with clear progression
- One task per screen
- Clear "Next" / "Back" navigation buttons

### Availability Display

- **Availability must not use calendar grid views**
- Use vertical lists, cards, or step-based selection
- Date selection: Single-column list or mobile-friendly date picker
- Time slot selection: Vertical list of available slots
- Court selection: Vertical list of available courts

### Interaction Patterns

- **Large tap targets** (minimum 44x44px for interactive elements)
- **Vertical lists** for all selectable options
- **One primary action per screen** (clearly highlighted)
- Avoid horizontal scrolling for critical content
- Use bottom sheets, modals, or full-screen overlays for secondary actions

---

## Tech & UI Constraints

All player features must adhere to these technical and styling rules:

### Technology Stack

- **Next.js** (monolith architecture, MVP stage)
- Server-side rendering where applicable
- TypeScript for all components and logic

### Styling Rules

- **Dark theme only**
  - All player-facing components must support dark theme
  - Use `im-*` semantic CSS classes for custom styles
  - Follow the existing dark theme color palette

- **Semantic CSS Classes: `im-*`**
  - Custom styles must use semantic class names prefixed with `im-`
  - Example: `im-player-card`, `im-availability-slot`, `im-booking-button`

- **Tailwind Usage (Limited)**
  - Tailwind is allowed **only** for:
    - Layout (flex, grid, container)
    - Spacing (padding, margin, gap)
    - Positioning (absolute, relative, fixed)
  - Tailwind must **not** be used for:
    - Colors (use `im-*` classes instead)
    - Typography (use `im-*` classes instead)
    - Complex styling (use `im-*` classes instead)

- **No Inline Styling**
  - Do not use inline `style` attributes
  - All styling must be defined in CSS classes or CSS modules

- **No Duplicated UI Primitives**
  - Always reuse existing components from `components/ui/*`
  - Do not create new buttons, inputs, modals, or cards if they already exist
  - Extend existing components when additional functionality is needed

### Component Reuse

- **Always check `components/ui/*` first**
- Use existing components for:
  - Buttons (`Button`, etc.)
  - Inputs (`Input`, etc.)
  - Modals / Dialogs
  - Cards
  - Tables (if needed)
  - Loading states (Skeleton loaders)
  - Toasts / Notifications

---

## Canonical Player Flow (Fixed Order)

The player flow follows a **strict, fixed order** that must not be changed:

```
1. Landing Page
   ↓
2. Club List
   ↓
3. Club Page (Club Details)
   ↓
4. Availability Selection
   ├── Step 1: Date Selection
   ├── Step 2: Time Slot Selection
   └── Step 3: Court Selection
   ↓
5. Booking Confirmation
   ↓
6. Success / Completion
```

### Screen Descriptions

#### 1. Landing Page

- **Purpose**: Entry point for players (if not logged in or first visit)
- **Content**: Platform introduction, call-to-action to view clubs
- **Navigation**: Leads to Club List
- **Notes**: Admin users skip this and go directly to admin dashboard

#### 2. Club List

- **Purpose**: Browse all available clubs
- **Content**: List of published clubs (vertical cards or list items)
- **Filters**: Search, location/city filters
- **Visibility**: Only shows clubs with published courts
- **Navigation**: Tap a club to view Club Page

#### 3. Club Page (Club Details)

- **Purpose**: View club information and access booking
- **Content**: Club name, description, address, contact info, images
- **Actions**: 
  - "View Availability" button (primary action)
  - Contact information display
- **Visibility**: Only accessible if club has published courts
- **Navigation**: "View Availability" leads to Availability Selection

#### 4. Availability Selection (3 Steps)

This is a **step-based** flow that must be completed in order:

##### Step 1: Date Selection

- **Purpose**: Choose a date for the booking
- **UI**: Vertical list or mobile-friendly date picker (not a grid calendar)
- **Validation**: Only future dates should be selectable
- **Navigation**: After selecting date, proceed to Step 2

##### Step 2: Time Slot Selection

- **Purpose**: Choose a time slot for the selected date
- **UI**: Vertical list of available time slots
- **Content**: Display available time slots with duration
- **Empty State**: If no slots available, show clear message
- **Navigation**: After selecting time slot, proceed to Step 3

##### Step 3: Court Selection

- **Purpose**: Choose a specific court for the selected date/time
- **UI**: Vertical list of available courts
- **Content**: Court name, surface type, capacity (if applicable)
- **Visibility**: Only show published courts that are available at the selected date/time
- **Navigation**: After selecting court, proceed to Booking Confirmation

#### 5. Booking Confirmation

- **Purpose**: Review and confirm the booking details
- **Content**: 
  - Selected date, time, court
  - Club information
  - Pricing (if applicable)
  - Player information (name, email)
- **Actions**: 
  - "Confirm Booking" button (primary action)
  - "Cancel" or "Back" button (secondary action)
- **Validation**: All booking details must be confirmed before submission
- **Navigation**: After confirmation, proceed to Success

#### 6. Success / Completion

- **Purpose**: Confirm successful booking
- **Content**: 
  - Success message
  - Booking reference/ID
  - Summary of booking details
- **Actions**: 
  - "View My Bookings" button
  - "Book Another Court" button
- **Navigation**: User can return to Club List or view their bookings

### Flow Rules

- **This order must not be changed**
  - Screens must appear in the exact sequence defined above
  - Do not skip steps or reorder them

- **Screens must not be skipped (except via quick booking)**
  - Quick booking is a special shortcut flow that may skip Club Page
  - Standard flow must go through all screens in order

- **Each step must be completed before proceeding**
  - Do not allow users to jump to Booking Confirmation without selecting date, time, and court
  - Validate each step before allowing navigation to the next

---

## Forbidden Behaviors

The following behaviors are **explicitly forbidden** and must never be implemented:

### 1. Showing Unpublished Courts

- ❌ **Never** display courts with `isPublic = false` in any player-facing view
- ❌ **Never** allow players to book unpublished courts
- ❌ **Never** expose unpublished court data in API responses for player endpoints

### 2. Showing Availability on Club List

- ❌ **Do not** show real-time availability (slots, courts) on the club list page
- ❌ **Do not** display "X courts available now" badges or indicators
- The club list should show only basic club information (name, location, image)

### 3. Using Grid-Based Availability UI

- ❌ **Do not** use calendar grid views (e.g., 7-column week grids)
- ❌ **Do not** use multi-column time slot grids
- ❌ **Do not** use desktop-style availability matrices
- Use vertical lists, cards, or mobile-friendly step-based selection instead

### 4. Mixing Admin and Player Components

- ❌ **Do not** reuse admin-specific components in player flows
- ❌ **Do not** show admin navigation, sidebars, or dashboards to players
- ❌ **Do not** expose admin-only data (e.g., unpublished content, analytics) to players
- Keep admin and player components completely separate

### 5. Requiring Login Before Viewing Clubs or Availability

- ❌ **Do not** force users to log in to browse clubs
- ❌ **Do not** require authentication to view club details or availability
- Login should be required only at the Booking Confirmation step
- Allow anonymous browsing of clubs and availability

### 6. Booking Without Explicit Confirmation

- ❌ **Do not** auto-confirm bookings without user interaction
- ❌ **Do not** skip the Booking Confirmation screen
- ❌ **Do not** submit bookings without explicit user consent
- Always require a clear "Confirm Booking" action before creating a booking

### 7. Desktop-First Patterns

- ❌ **Do not** design for desktop screens first
- ❌ **Do not** use multi-column layouts for critical content
- ❌ **Do not** use hover-only interactions (must work on touch devices)
- ❌ **Do not** create interfaces that require a mouse or keyboard

### 8. Inline Styling or Style Duplication

- ❌ **Do not** use inline `style` attributes
- ❌ **Do not** duplicate UI primitives (buttons, inputs, cards)
- ❌ **Do not** create custom components if existing ones can be reused
- Always check `components/ui/*` before creating new components

---

## Rules for AI / Copilot Execution

When implementing any player-related feature, GitHub Copilot or any AI assistant must adhere to the following rules:

### 1. Do Not Invent UX or Flows

- **Always follow the canonical player flow** defined in this document
- Do not create new screens or steps that are not explicitly defined
- Do not modify the order or structure of the flow without explicit approval
- Use the screens and steps exactly as specified

### 2. Do Not Reorder Screens

- **The flow order is fixed**: Landing → Club List → Club Page → Availability → Confirmation → Success
- Do not skip steps or change their sequence
- Do not introduce shortcuts that bypass required steps (except quick booking, which is a separate feature)

### 3. Do Not Introduce Desktop-First Patterns

- **Always design for mobile first**
- Do not use grid layouts, multi-column views, or desktop-centric UI patterns
- Do not rely on hover states or mouse-only interactions
- Ensure all interactions work on touch devices with large tap targets

### 4. Always Follow This Document Before Implementation

- **Read this document in full** before starting any player-related task
- Cross-reference this document when making decisions about UX, UI, or flow
- If this document conflicts with other instructions, prioritize this document for player features
- Ask for clarification if any rule is unclear

### 5. Enforce Player Rules (Hard Constraints)

- **Never show unpublished courts** to players
- **Never bypass the visibility rules** for clubs or courts
- **Always show empty states** when no content is available
- **Always separate admin and player flows** completely

### 6. Use Existing Components and Patterns

- **Always check `components/ui/*`** before creating new UI components
- **Follow the `im-*` semantic CSS class convention** for all custom styles
- **Use Tailwind only for layout, spacing, and positioning** (not colors or complex styling)
- **Reuse existing patterns** from other parts of the codebase

### 7. Mobile-First Validation

Before submitting any player-related code:

- Verify that the UI works on mobile screens (320px - 768px)
- Ensure tap targets are large enough (44x44px minimum)
- Confirm that no horizontal scrolling is required for critical content
- Test on touch devices if possible

### 8. Security and Data Privacy

- Do not expose unpublished or admin-only data to players
- Validate all user inputs on the server side
- Follow existing authentication and authorization patterns
- Use server-side API endpoints for all data fetching and mutations

---

## Out of Scope

This document **does not** cover the following (these will be addressed in future tasks):

- ❌ Specific component implementations (UI code)
- ❌ API endpoint definitions or implementations
- ❌ Routing configurations (Next.js routes)
- ❌ State management implementations (Zustand stores)
- ❌ Styling implementations (CSS code)
- ❌ Authentication flows (login, signup, password reset)
- ❌ Payment processing or pricing logic
- ❌ Notification or email systems

This document provides the **blueprint and rules** only. Implementation details will be defined in subsequent tasks that reference this document.

---

## Acceptance Criteria

This document is considered complete and ready for use if:

- ✅ `/docs/player-mobile-flow.md` exists
- ✅ Platform context is clearly defined
- ✅ Player rules (hard constraints) are explicitly listed
- ✅ UX constraints are clearly defined (mobile-first, step-based, no grids)
- ✅ Tech & UI constraints are clearly defined (Next.js, dark theme, `im-*` classes, component reuse)
- ✅ Canonical player flow is explicitly defined with fixed order
- ✅ Forbidden behaviors are clearly listed
- ✅ Copilot execution rules are clearly stated
- ✅ All rules are unambiguous and actionable
- ✅ Future tasks can reference this document directly

---

## Related Documents

- `.github/copilot-settings.md` - Universal project-wide rules for Copilot
- `docs/organization-club-visibility.md` - Visibility rules for organizations and clubs
- `docs/role-based-user-access.md` - Role-based access control documentation

---

## Changelog

- **2026-01-05**: Initial document created as the single source of truth for player mobile flow

---

**Important Reminder**: This document must be completed **before** any player UI or booking logic is implemented. All future player-related tasks must reference and follow this specification.
