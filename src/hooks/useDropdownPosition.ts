import { useEffect, useState, RefObject } from "react";

export interface DropdownPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: "bottom" | "top";
}

interface UseDropdownPositionOptions {
  /** Reference to the trigger element */
  triggerRef: RefObject<HTMLElement>;
  /** Whether the dropdown is open */
  isOpen: boolean;
  /** Offset from trigger element in pixels */
  offset?: number;
  /** Maximum dropdown height in pixels */
  maxHeight?: number;
  /** Whether to match trigger width */
  matchWidth?: boolean;
}

// Constants for viewport padding and spacing
const VIEWPORT_PADDING = 8; // Minimum distance from viewport edges
const SAFE_ZONE_BUFFER = 20; // Extra buffer for available space calculation

/**
 * Hook to calculate optimal positioning for a dropdown in a portal.
 * 
 * Calculates position based on trigger element's position and available space.
 * Automatically flips dropdown above trigger if not enough space below.
 * Recalculates on window resize and scroll.
 * 
 * @example
 * ```tsx
 * const triggerRef = useRef<HTMLDivElement>(null);
 * const position = useDropdownPosition({ triggerRef, isOpen: true });
 * 
 * <Portal>
 *   <div style={{ 
 *     position: 'fixed',
 *     top: `${position.top}px`,
 *     left: `${position.left}px`,
 *     width: `${position.width}px`
 *   }}>
 *     Dropdown content
 *   </div>
 * </Portal>
 * ```
 */
export function useDropdownPosition({
  triggerRef,
  isOpen,
  offset = 4,
  maxHeight = 300,
  matchWidth = true,
}: UseDropdownPositionOptions): DropdownPosition | null {
  const [position, setPosition] = useState<DropdownPosition | null>(null);

  useEffect(() => {
    if (!isOpen || !triggerRef.current) {
      setPosition(null);
      return;
    }

    const calculatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Calculate available space above and below
      const spaceBelow = viewportHeight - rect.bottom - offset;
      const spaceAbove = rect.top - offset;

      // Determine placement
      const placement: "bottom" | "top" = spaceBelow >= maxHeight || spaceBelow > spaceAbove
        ? "bottom"
        : "top";

      // Calculate actual max height based on available space
      const availableSpace = placement === "bottom" ? spaceBelow : spaceAbove;
      const actualMaxHeight = Math.min(maxHeight, availableSpace - SAFE_ZONE_BUFFER);

      // Calculate width first so we can use it for positioning
      const width = matchWidth ? rect.width : Math.min(rect.width, viewportWidth - (VIEWPORT_PADDING * 2));

      // Calculate vertical position
      // For upward placement, ensure dropdown doesn't go above viewport
      // For downward placement, position below trigger without clamping to top
      let top = placement === "bottom"
        ? rect.bottom + offset
        : rect.top - actualMaxHeight - offset;
      
      // Only clamp to top viewport edge for upward placement
      if (placement === "top" && top < VIEWPORT_PADDING) {
        top = VIEWPORT_PADDING;
      }

      // Calculate horizontal position
      // Ensure dropdown stays within viewport horizontally
      let left = rect.left;
      // Check if dropdown would overflow right edge
      if (left + width > viewportWidth - VIEWPORT_PADDING) {
        left = viewportWidth - width - VIEWPORT_PADDING;
      }
      // Check if dropdown would overflow left edge
      if (left < VIEWPORT_PADDING) {
        left = VIEWPORT_PADDING;
      }

      setPosition({
        top,
        left,
        width,
        maxHeight: actualMaxHeight,
        placement,
      });
    };

    // Calculate initial position
    calculatePosition();

    // Recalculate on scroll and resize
    const handleUpdate = () => {
      requestAnimationFrame(calculatePosition);
    };

    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);

    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [isOpen, triggerRef, offset, maxHeight, matchWidth]);

  return position;
}
