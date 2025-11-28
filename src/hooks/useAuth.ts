"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface UseAuthOptions {
  required?: boolean;
  redirectTo?: string;
}

export function useAuth(options: UseAuthOptions = {}) {
  const { required = false, redirectTo = "/auth/login" } = options;
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (required && status === "unauthenticated") {
      router.push(redirectTo);
    }
  }, [required, status, router, redirectTo]);

  return {
    session,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    user: session?.user,
  };
}
