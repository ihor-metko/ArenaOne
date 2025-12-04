"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AdminType } from "@/lib/requireRole";

interface UseRoleGuardResult {
  isLoading: boolean;
  isAuthorized: boolean;
}

interface UseAdminGuardResult {
  isLoading: boolean;
  isAuthorized: boolean;
  adminType: AdminType;
}

/**
 * Hook to guard routes that require root admin access.
 * Redirects unauthenticated users to sign-in and non-root users to /clubs.
 */
export function useRootAdminGuard(): UseRoleGuardResult {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const isRoot = session?.user?.isRoot;
  const isAuthorized = isAuthenticated && isRoot === true;

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
  const { status } = useSession();
  const router = useRouter();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
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
 * Hook to guard routes that require any admin access.
 * Checks for root admin, organization admin, or club admin roles.
 * Redirects unauthenticated users to sign-in and non-admins to /clubs.
 */
export function useAdminGuard(): UseAdminGuardResult {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [adminType, setAdminType] = useState<AdminType>(null);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  const isSessionLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    if (isSessionLoading) return;

    if (!isAuthenticated) {
      router.push("/auth/sign-in");
      setIsCheckingAdmin(false);
      return;
    }

    // If user is root admin, we already know they're authorized
    if (session?.user?.isRoot) {
      setAdminType("root");
      setIsCheckingAdmin(false);
      return;
    }

    // Check for organization/club admin via API
    const checkAdminAccess = async () => {
      try {
        const response = await fetch("/api/admin/check-access");
        if (response.ok) {
          const data = await response.json();
          setAdminType(data.adminType);
          // Redirect non-admins immediately
          if (data.adminType === null) {
            router.push("/clubs");
          }
        } else if (response.status === 401) {
          router.push("/auth/sign-in");
        } else {
          router.push("/clubs");
        }
      } catch {
        router.push("/clubs");
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdminAccess();
  }, [isSessionLoading, isAuthenticated, session?.user?.isRoot, router]);

  const isLoading = isSessionLoading || isCheckingAdmin;
  const isAuthorized = isAuthenticated && adminType !== null;

  return {
    isLoading,
    isAuthorized,
    adminType,
  };
}
