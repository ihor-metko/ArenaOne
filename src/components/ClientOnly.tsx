"use client";

import { useEffect, useState } from "react";

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * ClientOnly Component
 * 
 * Renders children only on the client side after hydration completes.
 * This prevents hydration mismatches for components that use browser-only APIs,
 * dynamic values, or render differently on client vs server.
 * 
 * @param children - Content to render only on client
 * @param fallback - Optional content to show during SSR and before hydration
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
