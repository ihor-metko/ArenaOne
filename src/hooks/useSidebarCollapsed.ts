"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "admin-sidebar-collapsed";

/**
 * Hook to manage sidebar collapsed state with localStorage persistence.
 * 
 * @returns Object containing:
 * - isCollapsed: Current collapsed state
 * - setIsCollapsed: Function to set collapsed state
 * - toggleCollapsed: Function to toggle collapsed state
 */
export function useSidebarCollapsed() {
  const [isCollapsed, setIsCollapsedState] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load initial state from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setIsCollapsedState(stored === "true");
      }
    } catch {
      // localStorage not available, use default
    }
    setIsHydrated(true);
  }, []);

  // Persist state to localStorage when it changes
  const setIsCollapsed = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setIsCollapsedState((prev) => {
      const newValue = typeof value === "function" ? value(prev) : value;
      try {
        localStorage.setItem(STORAGE_KEY, String(newValue));
      } catch {
        // localStorage not available
      }
      return newValue;
    });
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, [setIsCollapsed]);

  return {
    isCollapsed,
    setIsCollapsed,
    toggleCollapsed,
    isHydrated,
  };
}
