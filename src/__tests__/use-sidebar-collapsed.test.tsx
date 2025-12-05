/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";

describe("useSidebarCollapsed Hook", () => {
  const STORAGE_KEY = "admin-sidebar-collapsed";

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  it("returns isCollapsed as false by default", () => {
    const { result } = renderHook(() => useSidebarCollapsed());
    expect(result.current.isCollapsed).toBe(false);
  });

  it("returns isHydrated as true after initial render", () => {
    const { result } = renderHook(() => useSidebarCollapsed());
    expect(result.current.isHydrated).toBe(true);
  });

  it("toggleCollapsed changes isCollapsed state", () => {
    const { result } = renderHook(() => useSidebarCollapsed());
    
    expect(result.current.isCollapsed).toBe(false);
    
    act(() => {
      result.current.toggleCollapsed();
    });
    
    expect(result.current.isCollapsed).toBe(true);
    
    act(() => {
      result.current.toggleCollapsed();
    });
    
    expect(result.current.isCollapsed).toBe(false);
  });

  it("setIsCollapsed updates the state", () => {
    const { result } = renderHook(() => useSidebarCollapsed());
    
    act(() => {
      result.current.setIsCollapsed(true);
    });
    
    expect(result.current.isCollapsed).toBe(true);
    
    act(() => {
      result.current.setIsCollapsed(false);
    });
    
    expect(result.current.isCollapsed).toBe(false);
  });

  it("persists state to localStorage", () => {
    const { result } = renderHook(() => useSidebarCollapsed());
    
    act(() => {
      result.current.setIsCollapsed(true);
    });
    
    expect(localStorage.getItem(STORAGE_KEY)).toBe("true");
    
    act(() => {
      result.current.setIsCollapsed(false);
    });
    
    expect(localStorage.getItem(STORAGE_KEY)).toBe("false");
  });

  it("loads initial state from localStorage", () => {
    localStorage.setItem(STORAGE_KEY, "true");
    
    const { result } = renderHook(() => useSidebarCollapsed());
    
    expect(result.current.isCollapsed).toBe(true);
  });

  it("handles localStorage errors gracefully", () => {
    // Mock localStorage.getItem to throw an error
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = jest.fn(() => {
      throw new Error("localStorage error");
    });
    
    const { result } = renderHook(() => useSidebarCollapsed());
    
    // Should fall back to default value
    expect(result.current.isCollapsed).toBe(false);
    
    // Restore original implementation
    Storage.prototype.getItem = originalGetItem;
  });

  it("setIsCollapsed accepts a function updater", () => {
    const { result } = renderHook(() => useSidebarCollapsed());
    
    act(() => {
      result.current.setIsCollapsed((prev) => !prev);
    });
    
    expect(result.current.isCollapsed).toBe(true);
    
    act(() => {
      result.current.setIsCollapsed((prev) => !prev);
    });
    
    expect(result.current.isCollapsed).toBe(false);
  });
});
