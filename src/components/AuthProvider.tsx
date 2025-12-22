"use client";

import { UserStoreInitializer } from "./UserStoreInitializer";

/**
 * Auth Provider that initializes the user store without NextAuth's SessionProvider.
 * This eliminates redundant session fetches on re-renders and navigation.
 * 
 * The session is fetched once during app initialization via UserStoreInitializer
 * and stored in the global Zustand store as the single source of truth.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <UserStoreInitializer />
      {children}
    </>
  );
}
