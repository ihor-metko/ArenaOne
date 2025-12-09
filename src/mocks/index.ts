/**
 * Mocks Infrastructure
 * 
 * Central module for managing development-only mock data.
 * Controlled by NEXT_PUBLIC_USE_MOCKS environment variable.
 * 
 * Usage:
 * ```typescript
 * import { useMocks } from '@/mocks';
 * 
 * if (useMocks()) {
 *   // Use mock data
 *   return mockData;
 * } else {
 *   // Use real API
 *   return await fetch(...);
 * }
 * ```
 */

/**
 * Check if mock mode is enabled
 * 
 * Reads NEXT_PUBLIC_USE_MOCKS environment variable.
 * Returns true only when explicitly set to "true".
 * 
 * @returns {boolean} True if mocks should be used, false otherwise
 */
export function useMocks(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCKS === "true";
}
