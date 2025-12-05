"use client";

import "./Badge.css";

export type BadgeVariant = 
  | "default" 
  | "success" 
  | "warning" 
  | "danger" 
  | "info" 
  | "primary"
  | "secondary";

export interface BadgeProps {
  /** The variant/color of the badge */
  variant?: BadgeVariant;
  /** Whether the badge has a subtle (lighter) style */
  subtle?: boolean;
  /** Whether to show a dot indicator */
  dot?: boolean;
  /** Whether the dot should pulse (animate) */
  dotPulse?: boolean;
  /** Optional icon element to display before the text */
  icon?: React.ReactNode;
  /** The content of the badge */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Title for tooltip on hover */
  title?: string;
}

/**
 * Badge Component
 * 
 * A reusable badge component for displaying status, roles, tags, and labels.
 * Supports multiple variants, icons, and dot indicators.
 * 
 * @example
 * // Basic usage
 * <Badge variant="success">Active</Badge>
 * 
 * @example
 * // With dot indicator
 * <Badge variant="danger" dot>Blocked</Badge>
 * 
 * @example
 * // With icon
 * <Badge variant="info" icon={<UserIcon />}>Admin</Badge>
 */
export function Badge({
  variant = "default",
  subtle = false,
  dot = false,
  dotPulse = false,
  icon,
  children,
  className = "",
  title,
}: BadgeProps) {
  const variantClass = `im-badge--${variant}`;
  const subtleClass = subtle ? "im-badge--subtle" : "";
  
  return (
    <span 
      className={`im-badge ${variantClass} ${subtleClass} ${className}`.trim()}
      title={title}
    >
      {dot && (
        <span 
          className={`im-badge-dot ${dotPulse ? "im-badge-dot--pulse" : ""}`} 
          aria-hidden="true" 
        />
      )}
      {icon && (
        <span className="im-badge-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="im-badge-text">{children}</span>
    </span>
  );
}
