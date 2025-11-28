"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

interface UseAuthOptions {
  required?: boolean;
  redirectTo?: string;
}

export function useAuth(options?: UseAuthOptions) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const loading = status === "loading";
  const authenticated = status === "authenticated";
  const unauthenticated = status === "unauthenticated";

  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (optionsRef.current?.required && unauthenticated) {
      router.push(optionsRef.current.redirectTo || "/auth/login");
    }
  }, [unauthenticated, router]);

  return {
    session,
    user: session?.user,
    loading,
    authenticated,
    unauthenticated,
  };
}
