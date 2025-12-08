"use client";

import { SessionProvider } from "next-auth/react";
import { UserStoreInitializer } from "./UserStoreInitializer";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <UserStoreInitializer />
      {children}
    </SessionProvider>
  );
}
