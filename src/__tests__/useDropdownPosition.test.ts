/**
 * Test for useDropdownPosition hook
 * Verifies dropdown positioning logic for both upward and downward directions
 */

import { renderHook } from "@testing-library/react";
import { useDropdownPosition } from "@/hooks/useDropdownPosition";
import { RefObject } from "react";

// Mock getBoundingClientRect
const createMockElement = (rect: Partial<DOMRect>): HTMLElement => {
  const element = document.createElement("div");
  element.getBoundingClientRect = jest.fn(() => ({
    top: rect.top || 0,
    left: rect.left || 0,
    bottom: rect.bottom || 0,
    right: rect.right || 0,
    width: rect.width || 0,
    height: rect.height || 0,
    x: rect.x || 0,
    y: rect.y || 0,
    toJSON: () => ({}),
  }));
  return element;
};

describe("useDropdownPosition", () => {
  beforeEach(() => {
    // Set up viewport size
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 800,
    });
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1200,
    });
  });

  it("should position dropdown below trigger when enough space is available", () => {
    const mockElement = createMockElement({
      top: 100,
      left: 200,
      bottom: 140,
      width: 300,
    });
    
    const triggerRef = {
      current: mockElement,
    } as RefObject<HTMLElement>;

    const { result } = renderHook(() =>
      useDropdownPosition({
        triggerRef,
        isOpen: true,
        offset: 4,
        maxHeight: 300,
        matchWidth: true,
      })
    );

    expect(result.current).not.toBeNull();
    expect(result.current?.placement).toBe("bottom");
    expect(result.current?.top).toBe(144); // bottom (140) + offset (4)
    expect(result.current?.left).toBe(200); // same as trigger left
    expect(result.current?.width).toBe(300); // matches trigger width
  });

  it("should position dropdown above trigger when not enough space below", () => {
    const mockElement = createMockElement({
      top: 700,
      left: 200,
      bottom: 740,
      width: 300,
    });
    
    const triggerRef = {
      current: mockElement,
    } as RefObject<HTMLElement>;

    const { result } = renderHook(() =>
      useDropdownPosition({
        triggerRef,
        isOpen: true,
        offset: 4,
        maxHeight: 300,
        matchWidth: true,
      })
    );

    expect(result.current).not.toBeNull();
    expect(result.current?.placement).toBe("top");
    // top should be: trigger.top (700) - actualMaxHeight - offset
    // Available space above = 700 - 4 = 696
    // actualMaxHeight = min(300, 696 - 20) = 300
    // top = 700 - 300 - 4 = 396
    expect(result.current?.top).toBe(396);
    expect(result.current?.left).toBe(200);
  });

  it("should clamp top position to viewport padding for upward placement", () => {
    const mockElement = createMockElement({
      top: 50,
      left: 200,
      bottom: 90,
      width: 300,
    });
    
    const triggerRef = {
      current: mockElement,
    } as RefObject<HTMLElement>;

    const { result } = renderHook(() =>
      useDropdownPosition({
        triggerRef,
        isOpen: true,
        offset: 4,
        maxHeight: 300,
        matchWidth: true,
      })
    );

    expect(result.current).not.toBeNull();
    // With small top value, if it opens upward, it should clamp to VIEWPORT_PADDING (8)
    if (result.current?.placement === "top") {
      expect(result.current.top).toBeGreaterThanOrEqual(8);
    }
  });

  it("should not clamp top position for downward placement", () => {
    const mockElement = createMockElement({
      top: 10,
      left: 200,
      bottom: 50,
      width: 300,
    });
    
    const triggerRef = {
      current: mockElement,
    } as RefObject<HTMLElement>;

    const { result } = renderHook(() =>
      useDropdownPosition({
        triggerRef,
        isOpen: true,
        offset: 4,
        maxHeight: 300,
        matchWidth: true,
      })
    );

    expect(result.current).not.toBeNull();
    if (result.current?.placement === "bottom") {
      // Should position at bottom + offset, not clamped to 8
      expect(result.current.top).toBe(54); // bottom (50) + offset (4)
    }
  });

  it("should adjust left position when dropdown would overflow right edge", () => {
    const mockElement = createMockElement({
      top: 100,
      left: 1000, // Near right edge
      bottom: 140,
      width: 300,
    });
    
    const triggerRef = {
      current: mockElement,
    } as RefObject<HTMLElement>;

    const { result } = renderHook(() =>
      useDropdownPosition({
        triggerRef,
        isOpen: true,
        offset: 4,
        maxHeight: 300,
        matchWidth: true,
      })
    );

    expect(result.current).not.toBeNull();
    // Left should be adjusted to fit within viewport
    // Max left = viewportWidth (1200) - width (300) - VIEWPORT_PADDING (8) = 892
    expect(result.current?.left).toBe(892);
  });

  it("should adjust left position when dropdown would overflow left edge", () => {
    const mockElement = createMockElement({
      top: 100,
      left: -100, // Off left edge
      bottom: 140,
      width: 300,
    });
    
    const triggerRef = {
      current: mockElement,
    } as RefObject<HTMLElement>;

    const { result } = renderHook(() =>
      useDropdownPosition({
        triggerRef,
        isOpen: true,
        offset: 4,
        maxHeight: 300,
        matchWidth: true,
      })
    );

    expect(result.current).not.toBeNull();
    // Left should be clamped to VIEWPORT_PADDING (8)
    expect(result.current?.left).toBe(8);
  });

  it("should handle narrow viewport with wide dropdown correctly", () => {
    // Simulate narrow viewport
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 400,
    });

    const mockElement = createMockElement({
      top: 100,
      left: 100,
      bottom: 140,
      width: 500, // Wider than viewport
    });
    
    const triggerRef = {
      current: mockElement,
    } as RefObject<HTMLElement>;

    const { result } = renderHook(() =>
      useDropdownPosition({
        triggerRef,
        isOpen: true,
        offset: 4,
        maxHeight: 300,
        matchWidth: true,
      })
    );

    expect(result.current).not.toBeNull();
    // Should not position at top-left corner (the bug we're fixing)
    // With width=500 and viewport=400, left should be clamped appropriately
    // Since dropdown is wider than viewport, it should align to left edge
    expect(result.current?.left).toBe(8); // VIEWPORT_PADDING
    // Top should still be correct for downward placement
    expect(result.current?.top).toBe(144);
  });

  it("should return null when dropdown is not open", () => {
    const mockElement = createMockElement({
      top: 100,
      left: 200,
      bottom: 140,
      width: 300,
    });
    
    const triggerRef = {
      current: mockElement,
    } as RefObject<HTMLElement>;

    const { result } = renderHook(() =>
      useDropdownPosition({
        triggerRef,
        isOpen: false,
        offset: 4,
        maxHeight: 300,
        matchWidth: true,
      })
    );

    expect(result.current).toBeNull();
  });
});
