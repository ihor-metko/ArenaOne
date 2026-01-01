"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useUserStore } from "@/stores/useUserStore";
import type { User } from "@/stores/useUserStore";

interface UseRoleGuardResult {
  isLoading: boolean;
  isAuthorized: boolean;
}

interface UseAuthGuardOnceOptions {
  requireAuth?: boolean;
  redirectTo?: string;
}

interface UseAuthGuardOnceResult {
  isHydrated: boolean;
  isLoading: boolean;
  isLoggedIn: boolean;
  user: User | null;
}

/**
 * Hook to guard routes that require root admin access.
 * Redirects unauthenticated users to sign-in and non-root users to /clubs.
 */
export function useRootAdminGuard(): UseRoleGuardResult {
  const router = useRouter();
  const sessionStatus = useUserStore(state => state.sessionStatus);
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

/**
 * Hook to guard routes that require authentication.
 * Runs auth check only once after hydration to prevent unnecessary redirects.
 * 
 * @param options - Configuration options
 * @param options.requireAuth - If true, redirects unauthenticated users to sign-in
 * @param options.redirectTo - Custom redirect path (defaults to /auth/sign-in)
 * @returns Auth state with hydration status
 */
export function useAuthGuardOnce(options: UseAuthGuardOnceOptions = {}): UseAuthGuardOnceResult {
  const { requireAuth = false, redirectTo = "/auth/sign-in" } = options;
  const router = useRouter();
  const hasRedirected = useRef(false);
  
  const isHydrated = useUserStore(state => state.isHydrated);
  const isLoading = useUserStore(state => state.isLoading);
  const sessionStatus = useUserStore(state => state.sessionStatus);
  const user = useUserStore(state => state.user);
  const isLoggedIn = useUserStore(state => state.isLoggedIn);

  useEffect(() => {
    // Wait until hydrated and not loading
    if (!isHydrated || isLoading) return;
    
    // Only redirect once
    if (hasRedirected.current) return;

    // If auth is required and user is not authenticated, redirect
    if (requireAuth && sessionStatus === "unauthenticated") {
      hasRedirected.current = true;
      router.push(redirectTo);
    }
  }, [isHydrated, isLoading, requireAuth, sessionStatus, redirectTo, router]);

  return {
    isHydrated,
    isLoading,
    isLoggedIn,
    user,
  };
}
