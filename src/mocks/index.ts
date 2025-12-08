/**
 * Mock Data Helper
 * 
 * Dev-only utility to enable/disable mock data for admin pages.
 * This allows developers and QA to view full UI states without backend dependencies.
 * 
 * Usage:
 * - Set NEXT_PUBLIC_USE_MOCKS=true in your .env.local to enable mocks
 * - Mocks are disabled by default and never run in production
 */

/**
 * Check if mocks should be used based on environment variable
 * @returns true if mocks are enabled, false otherwise
 * 
 * Note: This is NOT a React Hook despite the name pattern.
 * It's a regular function that can be called anywhere.
 */
export function shouldUseMocks(): boolean {
  // Never use mocks in production
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  // Check if the environment flag is set to "true"
  return process.env.NEXT_PUBLIC_USE_MOCKS === "true";
}
