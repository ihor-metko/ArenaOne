import { renderHook } from "@testing-library/react";
import { useDropdownPosition } from "@/hooks/useDropdownPosition";
import { RefObject } from "react";

describe("useDropdownPosition", () => {
  let mockTriggerElement: HTMLElement;

  beforeEach(() => {
    // Create a mock trigger element
    mockTriggerElement = document.createElement("div");
    document.body.appendChild(mockTriggerElement);

    // Mock getBoundingClientRect
    jest.spyOn(mockTriggerElement, "getBoundingClientRect");
    
    // Mock window dimensions
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

  afterEach(() => {
    document.body.removeChild(mockTriggerElement);
    jest.restoreAllMocks();
  });

  it("should position dropdown below when enough space is available", () => {
    // Trigger at the top of the viewport
    (mockTriggerElement.getBoundingClientRect as jest.Mock).mockReturnValue({
      top: 50,
      bottom: 90,
      left: 100,
      right: 400,
      width: 300,
      height: 40,
    });

    const triggerRef = { current: mockTriggerElement } as RefObject<HTMLElement>;
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
    // Should be positioned just below the trigger
    expect(result.current?.top).toBe(90 + 4); // bottom + offset
  });

  it("should position dropdown above when not enough space below", () => {
    // Trigger near the bottom of the viewport
    (mockTriggerElement.getBoundingClientRect as jest.Mock).mockReturnValue({
      top: 700,
      bottom: 740,
      left: 100,
      right: 400,
      width: 300,
      height: 40,
    });

    const triggerRef = { current: mockTriggerElement } as RefObject<HTMLElement>;
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
    // For top placement, the dropdown is positioned using bottom CSS property in the component
    // The hook provides the top value which represents where the bottom of dropdown should be
    expect(result.current?.top).toBeGreaterThan(0);
  });

  it("should calculate maxHeight based on available space", () => {
    // Trigger near bottom with very limited space
    (mockTriggerElement.getBoundingClientRect as jest.Mock).mockReturnValue({
      top: 720,
      bottom: 760,
      left: 100,
      right: 400,
      width: 300,
      height: 40,
    });

    const triggerRef = { current: mockTriggerElement } as RefObject<HTMLElement>;
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
    // Available space below = 800 - 760 - 4 = 36px (very limited)
    // Available space above = 720 - 4 = 716px (much more space)
    // Should place above since more space available
    expect(result.current?.placement).toBe("top");
    // maxHeight should use the full 300 since there's plenty of space above
    expect(result.current?.maxHeight).toBe(300);
  });

  it("should match trigger width when matchWidth is true", () => {
    (mockTriggerElement.getBoundingClientRect as jest.Mock).mockReturnValue({
      top: 100,
      bottom: 140,
      left: 50,
      right: 350,
      width: 300,
      height: 40,
    });

    const triggerRef = { current: mockTriggerElement } as RefObject<HTMLElement>;
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
    expect(result.current?.width).toBe(300);
    expect(result.current?.left).toBe(50);
  });

  it("should return null when not open", () => {
    const triggerRef = { current: mockTriggerElement } as RefObject<HTMLElement>;
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

  it("should respect viewport padding", () => {
    // Trigger at the very edge of viewport
    (mockTriggerElement.getBoundingClientRect as jest.Mock).mockReturnValue({
      top: 2,
      bottom: 42,
      left: 2,
      right: 302,
      width: 300,
      height: 40,
    });

    const triggerRef = { current: mockTriggerElement } as RefObject<HTMLElement>;
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
    // Top should respect viewport padding (minimum 8px)
    expect(result.current?.top).toBeGreaterThanOrEqual(8);
    // Left should respect viewport padding
    expect(result.current?.left).toBeGreaterThanOrEqual(8);
  });
});
