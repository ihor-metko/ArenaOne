"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/stores/useUserStore";

/**
 * Client component to initialize the user store on app start.
 * This component loads user data when the session becomes available.
 */
export function UserStoreInitializer() {
  const { status } = useSession();
  const loadUser = useUserStore(state => state.loadUser);
  const clearUser = useUserStore(state => state.clearUser);

  useEffect(() => {
    if (status === "authenticated") {
      // Load user data into the store when authenticated
      loadUser();
    } else if (status === "unauthenticated") {
      // Clear user data when unauthenticated
      clearUser();
    }
  }, [status, loadUser, clearUser]);

  // This component doesn't render anything
  return null;
}
