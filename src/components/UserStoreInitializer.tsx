"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/stores/useUserStore";

/**
 * Time to wait for Zustand persist to restore from localStorage
 */
const HYDRATION_TIMEOUT_MS = 100;

/**
 * Client component to initialize the user store on app start.
 * This component loads user data once on initial app load.
 * It waits for hydration to complete before loading fresh data.
 */
export function UserStoreInitializer() {
  const loadUser = useUserStore(state => state.loadUser);
  const isHydrated = useUserStore(state => state.isHydrated);
  const setHydrated = useUserStore(state => state.setHydrated);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Wait for hydration to complete
  useEffect(() => {
    // If not hydrated yet, mark as hydrated after a brief delay
    // This allows Zustand persist to restore from localStorage
    if (!isHydrated) {
      const timer = setTimeout(() => {
        setHydrated(true);
      }, HYDRATION_TIMEOUT_MS);
      return () => clearTimeout(timer);
    }
  }, [isHydrated, setHydrated]);

  useEffect(() => {
    // Only proceed after hydration is complete
    if (!isHydrated) return;

    // Prevent multiple initializations
    if (hasInitialized) return;

    // Load user data into the store when app initializes
    // This replaces NextAuth's SessionProvider session fetching
    loadUser().finally(() => setHasInitialized(true));
  }, [loadUser, isHydrated, hasInitialized]);

  // This component doesn't render anything
  return null;
}
