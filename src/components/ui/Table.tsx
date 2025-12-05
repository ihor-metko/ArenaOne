"use client";

import { ReactNode } from "react";
import "./Table.css";

export interface TableColumn<T> {
  /** Unique key for the column */
  key: string;
  /** Header text */
  header: string;
  /** Whether the column is sortable */
  sortable?: boolean;
  /** Custom cell renderer */
  render?: (item: T, index: number) => ReactNode;
  /** Width class (e.g., "w-32", "flex-1") */
  width?: string;
  /** Alignment */
  align?: "left" | "center" | "right";
  /** Screen reader only header */
  srOnly?: boolean;
}

export interface TableProps<T> {
  /** Array of data items to display */
  data: T[];
  /** Column definitions */
  columns: TableColumn<T>[];
  /** Function to get unique key for each row */
  keyExtractor: (item: T) => string;
  /** Current sort field */
  sortBy?: string;
  /** Current sort order */
  sortOrder?: "asc" | "desc";
  /** Handler for sort changes */
  onSort?: (field: string) => void;
  /** Whether the table is loading */
  loading?: boolean;
  /** Text to display when there's no data */
  emptyText?: string;
  /** Additional CSS class for the wrapper */
  className?: string;
  /** Row click handler */
  onRowClick?: (item: T) => void;
  /** Whether rows are clickable (adds hover styles) */
  hoverable?: boolean;
  /** Caption for accessibility */
  caption?: string;
}

/**
 * Table Component
 * 
 * A reusable, accessible table component with sorting support.
 * Follows im-* styling conventions and supports dark theme.
 * 
 * @example
 * <Table
 *   data={users}
 *   columns={[
 *     { key: "name", header: "Name", sortable: true },
 *     { key: "email", header: "Email" },
 *     { key: "actions", header: "Actions", render: (user) => <Button>Edit</Button> },
 *   ]}
 *   keyExtractor={(user) => user.id}
 *   sortBy="name"
 *   sortOrder="asc"
 *   onSort={(field) => handleSort(field)}
 * />
 */
export function Table<T>({
  data,
  columns,
  keyExtractor,
  sortBy,
  sortOrder,
  onSort,
  loading = false,
  emptyText = "No data available",
  className = "",
  onRowClick,
  hoverable = true,
  caption,
}: TableProps<T>) {
  const getSortIcon = (columnKey: string) => {
    if (sortBy !== columnKey) {
      return (
        <svg className="im-table-sort-icon im-table-sort-icon--inactive" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8 3.5l4 4H4l4-4z" opacity="0.4" />
          <path d="M8 12.5l-4-4h8l-4 4z" opacity="0.4" />
        </svg>
      );
    }
    
    if (sortOrder === "asc") {
      return (
        <svg className="im-table-sort-icon im-table-sort-icon--asc" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8 3.5l4 4H4l4-4z" />
        </svg>
      );
    }
    
    return (
      <svg className="im-table-sort-icon im-table-sort-icon--desc" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 12.5l-4-4h8l-4 4z" />
      </svg>
    );
  };

  const handleHeaderClick = (column: TableColumn<T>) => {
    if (column.sortable && onSort) {
      onSort(column.key);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, column: TableColumn<T>) => {
    if ((e.key === "Enter" || e.key === " ") && column.sortable && onSort) {
      e.preventDefault();
      onSort(column.key);
    }
  };

  const getAlignClass = (align?: "left" | "center" | "right") => {
    switch (align) {
      case "center":
        return "im-table-cell--center";
      case "right":
        return "im-table-cell--right";
      default:
        return "im-table-cell--left";
    }
  };

  return (
    <div className={`im-table-wrapper ${className}`.trim()}>
      <table className="im-table" role="table">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="im-table-head">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`
                  im-table-header
                  ${column.sortable ? "im-table-header--sortable" : ""}
                  ${sortBy === column.key ? "im-table-header--sorted" : ""}
                  ${getAlignClass(column.align)}
                  ${column.width || ""}
                  ${column.srOnly ? "sr-only" : ""}
                `.trim()}
                onClick={() => handleHeaderClick(column)}
                onKeyDown={(e) => handleKeyDown(e, column)}
                tabIndex={column.sortable ? 0 : undefined}
                role={column.sortable ? "button" : undefined}
                aria-sort={
                  sortBy === column.key
                    ? sortOrder === "asc"
                      ? "ascending"
                      : "descending"
                    : undefined
                }
              >
                <span className="im-table-header-content">
                  {column.header}
                  {column.sortable && getSortIcon(column.key)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="im-table-body">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="im-table-loading">
                <div className="im-table-loading-spinner" />
                <span>Loading...</span>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="im-table-empty">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={keyExtractor(item)}
                className={`
                  im-table-row
                  ${hoverable ? "im-table-row--hoverable" : ""}
                  ${onRowClick ? "im-table-row--clickable" : ""}
                `.trim()}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? "button" : undefined}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`
                      im-table-cell
                      ${getAlignClass(column.align)}
                      ${column.width || ""}
                    `.trim()}
                  >
                    {column.render
                      ? column.render(item, index)
                      : (item as Record<string, unknown>)[column.key] as ReactNode}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
