# Unified Admin List Pages with Persisted State

## Overview

This document describes the unified approach for admin list pages (Users, Clubs, Bookings, Organizations) using reusable components and the `useListController` hook for persistent state management.

## Architecture

### useListController Hook

The `useListController` hook provides centralized state management for list pages with automatic localStorage persistence:

**Location:** `src/hooks/useListController.ts`

**Features:**
- Manages filters, sorting, and pagination state
- Automatic localStorage persistence with debouncing (300ms default)
- Per-entity storage keys (e.g., `filters_users`, `filters_clubs`)
- Type-safe filter definitions
- Automatic page reset when filters change
- Graceful error handling

**Example Usage:**
```typescript
const {
  filters,
  setFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  page,
  setPage,
  pageSize,
  setPageSize,
  clearFilters,
} = useListController<UserFilters>({
  entityKey: "users",
  defaultFilters: {
    searchQuery: "",
    roleFilter: "",
    statusFilter: "",
  },
  defaultSortBy: "createdAt",
  defaultSortOrder: "desc",
  defaultPage: 1,
  defaultPageSize: 10,
});
```

## Reusable Components

### AdminListFilters

**Location:** `src/components/admin/AdminListFilters.tsx`

Provides a consistent filters card UI with:
- Filter icon header
- Clear filters button (shown when filters are active)
- Grid layout for filter fields
- Consistent dark theme styling

**Props:**
- `title`: Filter section title
- `hasActiveFilters`: Boolean to show/hide clear button
- `onClearFilters`: Clear filters callback
- `clearFiltersText`: Text for clear button
- `children`: Filter input components

### AdminListPagination

**Location:** `src/components/admin/AdminListPagination.tsx`

Provides consistent pagination controls with:
- Page number display
- Previous/Next buttons
- Page number buttons (up to 5 visible)
- Page size selector
- Item count display

**Props:**
- `page`: Current page (1-indexed)
- `totalPages`: Total number of pages
- `pageSize`: Items per page
- `totalCount`: Total item count
- `onPageChange`: Page change callback
- `onPageSizeChange`: Page size change callback
- `pageSizeOptions`: Available page sizes (default: [10, 25, 50, 100])
- `translations`: Localized text strings

### AdminListEmpty

**Location:** `src/components/admin/AdminListEmpty.tsx`

Provides a consistent empty state with:
- Icon display
- Title text
- Optional description text
- Centered card layout

**Props:**
- `icon`: React node for icon
- `title`: Empty state title
- `description`: Optional description text

### AdminListLoading

**Location:** `src/components/admin/AdminListLoading.tsx`

Provides a consistent loading state with:
- Spinning loader animation
- Loading message text
- Centered layout

**Props:**
- `message`: Loading message text (default: "Loading...")

## Implementation Status

### ✅ Users Page (`/admin/users`)

**Status:** Fully refactored

**Changes:**
- Integrated `useListController` with persistent filters
- Uses `AdminListFilters` for filters card
- Uses `AdminListPagination` for pagination controls
- Uses `AdminListEmpty` for empty state
- Removed duplicate icon components

**Filters:**
- Search query
- Role filter
- Status filter
- Organization filter
- Club filter

**LocalStorage Key:** `filters_users`

### ✅ Clubs Page (`/admin/clubs`)

**Status:** Partially refactored

**Changes:**
- Already uses `useListController`
- Added `AdminListLoading` for loading state
- Custom inline filters (different layout from Users)

**Filters:**
- Search query
- Organization filter (root admin only)
- City filter
- Status filter

**LocalStorage Key:** `filters_clubs`

### ✅ Bookings Page (`/admin/bookings`)

**Status:** Partially refactored

**Changes:**
- Already uses `useListController`
- Added `AdminListLoading` for loading state
- Custom inline filters (different layout)

**Filters:**
- Organization filter
- Club filter
- Date range (from/to)
- Status filter

**LocalStorage Key:** `filters_bookings`

### ✅ Organizations Page (`/admin/organizations`)

**Status:** Updated to use useListController

**Changes:**
- Integrated `useListController` for persistent state
- Added `AdminListLoading` import
- Maintains existing UI layout (skeleton loading)

**Filters:**
- Search query

**LocalStorage Key:** `filters_organizations`

## Benefits

1. **Persistent State**: User filters, sorting, and pagination persist across page reloads and navigation
2. **Consistent UX**: Common UI patterns for filters, pagination, and empty states
3. **Type Safety**: TypeScript interfaces for filter definitions
4. **Performance**: Debounced localStorage writes to avoid excessive I/O
5. **Maintainability**: Centralized state logic, easier to add new list pages
6. **Extensibility**: Easy to add server-side persistence in the future

## Future Enhancements

1. **Server-Side Persistence**: Store user preferences in database
2. **Additional Components**: Create reusable table header with sorting
3. **Search Debouncing**: Add debouncing for search input (already handled by useListController)
4. **Filter Presets**: Allow users to save and load filter configurations
5. **Export Functionality**: Add export buttons to reusable components
6. **Column Visibility**: Allow users to toggle column visibility

## Testing

The `useListController` hook has comprehensive unit tests:

**Location:** `src/__tests__/useListController.test.ts`

**Coverage:**
- Initial state
- Filter updates
- Sort updates
- Pagination
- LocalStorage persistence
- Debouncing
- Error handling
- State merging

## Migration Guide

To migrate a new admin list page to use this pattern:

1. **Define filter interface:**
```typescript
interface MyFilters {
  searchQuery: string;
  statusFilter: string;
}
```

2. **Initialize useListController:**
```typescript
const {
  filters,
  setFilter,
  // ... other props
} = useListController<MyFilters>({
  entityKey: "myentity",
  defaultFilters: { searchQuery: "", statusFilter: "" },
});
```

3. **Replace filters UI with AdminListFilters:**
```typescript
<AdminListFilters
  title={t("myentity.filters")}
  hasActiveFilters={!!filters.searchQuery || !!filters.statusFilter}
  onClearFilters={clearFilters}
>
  {/* Your filter inputs */}
</AdminListFilters>
```

4. **Replace pagination with AdminListPagination:**
```typescript
<AdminListPagination
  page={page}
  totalPages={totalPages}
  pageSize={pageSize}
  totalCount={totalCount}
  onPageChange={setPage}
  onPageSizeChange={setPageSize}
  translations={/* ... */}
/>
```

5. **Use AdminListEmpty and AdminListLoading for states**

## Notes

- Each entity has its own localStorage key to avoid conflicts
- Filter state automatically resets page to 1 when changed
- Page size changes also reset to page 1
- Debouncing prevents excessive localStorage writes
- Graceful degradation if localStorage is unavailable
