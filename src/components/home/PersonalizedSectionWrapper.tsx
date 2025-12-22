"use client";

import { PersonalizedSection } from "@/components/PersonalizedSection";
import { useUserStore } from "@/stores/useUserStore";

/**
 * Client Component wrapper that conditionally renders PersonalizedSection
 * based on authentication state
 */
export function PersonalizedSectionWrapper() {
  const sessionStatus = useUserStore(state => state.sessionStatus);
  const user = useUserStore(state => state.user);

  const isAuthenticated = sessionStatus === "authenticated" && user;

  if (!isAuthenticated || !user?.name) {
    return null;
  }

  return <PersonalizedSection userName={user.name} />;
}
