"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUserStore } from "@/stores/useUserStore";

interface UseRoleGuardResult {
  isLoading: boolean;
  isAuthorized: boolean;
}

/**
 * Hook to guard routes that require root admin access.
 * Redirects unauthenticated users to sign-in and non-root users to /clubs.
 */
export function useRootAdminGuard(): UseRoleGuardResult {
  const router = useRouter();
  const sessionStatus = useUserStore(state => state.sessionStatus);
  const user = useUserStore(state => state.user);
  const hasRole = useUserStore(state => state.hasRole);
  const isUserLoading = useUserStore(state => state.isLoading);

  const isLoading = sessionStatus === "loading" || isUserLoading;
  const isAuthenticated = sessionStatus === "authenticated";
  const isRoot = hasRole("ROOT_ADMIN");
  const isAuthorized = isAuthenticated && isRoot;

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/auth/sign-in");
      return;
    }

    if (!isAuthorized) {
      router.push("/clubs");
    }
  }, [isLoading, isAuthenticated, isAuthorized, router]);

  return {
    isLoading,
    isAuthorized,
  };
}

/**
 * Hook to guard routes that require authentication only.
 * Redirects unauthenticated users to sign-in.
 */
export function useAuthGuard(): UseRoleGuardResult {
  const router = useRouter();
  const sessionStatus = useUserStore(state => state.sessionStatus);

  const isLoading = sessionStatus === "loading";
  const isAuthenticated = sessionStatus === "authenticated";
  const isAuthorized = isAuthenticated;

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/auth/sign-in");
    }
  }, [isLoading, isAuthenticated, router]);

  return {
    isLoading,
    isAuthorized,
  };
}
