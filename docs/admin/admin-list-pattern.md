# Admin List Pages - Standard Pattern

This document describes the standard pattern for creating admin list pages with persistent state management.

## Core Components

1. **useListController Hook** - Manages filters, sorting, and pagination with localStorage persistence
2. **AdminListPagination** - Reusable pagination UI component

## Pattern

See `src/app/(pages)/admin/users/page.tsx` for a complete example.

### 1. Define Filter Interface
### 2. Initialize useListController
### 3. Implement Data Fetching
### 4. Render Filters
### 5. Render List Content
### 6. Add Pagination

## Benefits

- Persistent state across page reloads
- Type-safe filter management
- Consistent pagination UI
- Reusable components

## Files

- Hook: `src/hooks/useListController.ts`
- Pagination: `src/components/admin/AdminList/AdminListPagination.tsx`
- Tests: `src/__tests__/useListController.test.ts`, `src/__tests__/AdminListPagination.test.tsx`
