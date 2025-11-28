"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useAuth(options?: { required?: boolean; redirectTo?: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const loading = status === "loading";
  const authenticated = status === "authenticated";
  const unauthenticated = status === "unauthenticated";

  useEffect(() => {
    if (options?.required && unauthenticated) {
      router.push(options.redirectTo || "/auth/login");
    }
  }, [unauthenticated, options?.required, options?.redirectTo, router]);

  return {
    session,
    user: session?.user,
    loading,
    authenticated,
    unauthenticated,
  };
}
