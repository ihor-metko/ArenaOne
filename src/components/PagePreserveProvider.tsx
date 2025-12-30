"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "arena_last_page";
const EXCLUDED_PATHS = ["/auth/sign-in", "/auth/sign-up", "/invites/accept"];

/**
 * PagePreserveProvider
 * 
 * A universal provider that preserves the current page and query parameters across reloads.
 * This component uses sessionStorage to save the current URL and restores it on app initialization.
 * 
 * Features:
 * - Automatically saves the current page URL with query parameters
 * - Restores the last visited page after reload
 * - Excludes auth pages to prevent redirect loops
 * - Works globally without needing to add code to individual pages
 * 
 * Usage:
 * Add this provider to the root layout to enable page preservation across the entire app.
 */
export function PagePreserveProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasRestoredRef = useRef(false);
  const isInitialMountRef = useRef(true);

  // Restore saved page on mount
  useEffect(() => {
    // Only restore once on initial mount
    if (!isInitialMountRef.current || hasRestoredRef.current) return;

    isInitialMountRef.current = false;

    // Skip if we're already on a non-root page or an excluded path
    const currentPath = pathname;
    const isRootPath = currentPath === "/";
    const isExcludedPath = EXCLUDED_PATHS.some((path) => currentPath.startsWith(path));

    if (!isRootPath || isExcludedPath) {
      hasRestoredRef.current = true;
      return;
    }

    try {
      const savedUrl = sessionStorage.getItem(STORAGE_KEY);
      
      if (savedUrl && savedUrl !== "/") {
        // Parse the saved URL to check if it's excluded
        const url = new URL(savedUrl, window.location.origin);
        const savedPath = url.pathname;
        const isExcluded = EXCLUDED_PATHS.some((path) => savedPath.startsWith(path));
        
        if (!isExcluded) {
          hasRestoredRef.current = true;
          // Use replace to avoid adding to browser history
          router.replace(savedUrl);
          return;
        }
      }
    } catch (error) {
      console.warn("Failed to restore page from sessionStorage:", error);
    }

    hasRestoredRef.current = true;
  }, [pathname, router]);

  // Save current page whenever it changes
  useEffect(() => {
    // Don't save if we haven't attempted restoration yet
    if (!hasRestoredRef.current) return;

    // Don't save excluded paths
    const isExcludedPath = EXCLUDED_PATHS.some((path) => pathname.startsWith(path));
    if (isExcludedPath) return;

    // Don't save root path
    if (pathname === "/") return;

    try {
      // Build full URL with query parameters
      const params = searchParams.toString();
      const fullUrl = params ? `${pathname}?${params}` : pathname;
      
      sessionStorage.setItem(STORAGE_KEY, fullUrl);
    } catch (error) {
      console.warn("Failed to save page to sessionStorage:", error);
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}
