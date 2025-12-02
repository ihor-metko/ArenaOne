"use client";

import { useSession } from "next-auth/react";
import { PersonalizedSection } from "@/components/PersonalizedSection";

/**
 * Client Component wrapper that conditionally renders PersonalizedSection
 * based on authentication state
 */
export function PersonalizedSectionWrapper() {
  const { data: session, status } = useSession();

  const isAuthenticated = status === "authenticated" && session?.user;

  if (!isAuthenticated || !session?.user?.name) {
    return null;
  }

  return <PersonalizedSection userName={session.user.name} />;
}
