"use client";

import { ReactNode } from "react";
import { PageHeader, Card } from "@/components/ui";
import { UseListControllerReturn } from "@/hooks";
import { AdminListPagination } from "./AdminListPagination";
import "./AdminList.css";

/**
 * Props for AdminList component
 */
export interface AdminListProps<TItem = unknown> {
  /** Page title */
  title: string;
  /** Page subtitle/description */
  subtitle?: string;
  /** Actions to display in page header (e.g., Create button) */
  headerActions?: ReactNode;
  /** Render function for filters */
  renderFilters: (controller: UseListControllerReturn<unknown>) => ReactNode;
  /** Render function for list content (table, cards, etc.) */
  renderList: (controller: UseListControllerReturn<unknown>, items: TItem[], loading: boolean) => ReactNode;
  /** List controller instance (from useListController hook) */
  controller: UseListControllerReturn<unknown>;
  /** Items to display */
  items: TItem[];
  /** Loading state */
  loading: boolean;
  /** Error message */
  error?: string;
  /** Total count of items */
  totalCount?: number;
  /** Total pages */
  totalPages?: number;
  /** Empty state message */
  emptyMessage?: string;
  /** Empty state description */
  emptyDescription?: string;
  /** Empty state icon (optional) */
  emptyIcon?: ReactNode;
  /** Breadcrumbs (optional) */
  breadcrumbs?: ReactNode;
  /** Show pagination (default: true) */
  showPagination?: boolean;
  /** Custom pagination labels */
  paginationLabels?: {
    showingText?: string;
    previousText?: string;
    nextText?: string;
    pageSizeLabel?: string;
  };
}

/**
 * Generic AdminList component
 * 
 * This component provides a reusable structure for admin list pages with:
 * - Common UI shell (header, filters, content, pagination)
 * - Flexible rendering via render props for entity-specific UI
 * - Integrated pagination component with customizable labels
 * - Error and empty states
 * 
 * The component is a **presentation component** that doesn't manage data fetching.
 * Pages should:
 * 1. Initialize useListController hook
 * 2. Fetch data when controller state changes (via useEffect)
 * 3. Pass the controller and data to AdminList
 * 
 * Features:
 * - Works with any entity type (Users, Clubs, Bookings, etc.)
 * - Maintains state persistence via useListController
 * - Provides consistent layout and UX across all admin list pages
 * - Type-safe and flexible
 * 
 * @example
 * ```tsx
 * const controller = useListController({
 *   entityKey: "users",
 *   defaultFilters: { search: "", role: "" },
 * });
 * 
 * // Fetch data when controller changes
 * useEffect(() => {
 *   fetchUsers(controller.filters, controller.sortBy, controller.page);
 * }, [controller.filters, controller.sortBy, controller.page]);
 * 
 * return (
 *   <AdminList
 *     title="Users"
 *     subtitle="Manage system users"
 *     controller={controller}
 *     renderFilters={(ctrl) => <UserFilters {...ctrl} />}
 *     renderList={(ctrl, items) => <UserTable items={items} />}
 *     items={users}
 *     loading={loading}
 *     totalCount={totalCount}
 *     totalPages={totalPages}
 *   />
 * );
 * ```
 */
export function AdminList<TItem = unknown>({
  title,
  subtitle,
  headerActions,
  renderFilters,
  renderList,
  controller,
  items,
  loading,
  error,
  totalCount = 0,
  totalPages = 0,
  emptyMessage,
  emptyDescription,
  emptyIcon,
  breadcrumbs,
  showPagination = true,
  paginationLabels,
}: AdminListProps<TItem>) {
  // Show loading state on initial load
  if (loading && items.length === 0 && !error) {
    return (
      <main className="im-admin-list-page">
        <div className="im-admin-list-loading">
          <div className="im-admin-list-loading-spinner" />
          <span className="im-admin-list-loading-text">Loading...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="im-admin-list-page">
      <PageHeader
        title={title}
        description={subtitle}
        actions={headerActions}
      />

      <section className="rsp-content">
        {breadcrumbs}

        {/* Filters Section */}
        {renderFilters(controller)}

        {/* Error Display */}
        {error && (
          <div className="im-error-alert" role="alert">
            <span className="im-error-icon">!</span>
            <span>{error}</span>
          </div>
        )}

        {/* Empty State */}
        {items.length === 0 && !loading ? (
          <Card className="im-empty-state">
            <div className="im-empty-state-content">
              {emptyIcon && <div className="im-empty-state-icon">{emptyIcon}</div>}
              {emptyMessage && <h3 className="im-empty-state-title">{emptyMessage}</h3>}
              {emptyDescription && <p className="im-empty-state-description">{emptyDescription}</p>}
            </div>
          </Card>
        ) : (
          <>
            {/* List Content */}
            {renderList(controller, items, loading)}

            {/* Pagination */}
            {showPagination && totalPages > 1 && (
              <AdminListPagination
                page={controller.page}
                pageSize={controller.pageSize}
                totalCount={totalCount}
                totalPages={totalPages}
                setPage={controller.setPage}
                setPageSize={controller.setPageSize}
                {...paginationLabels}
              />
            )}
          </>
        )}
      </section>
    </main>
  );
}
