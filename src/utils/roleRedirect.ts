/**
 * Role-based redirect utilities for the application
 */

import type { UserRole } from "@/lib/auth";

/**
 * Role-specific homepage paths
 */
export const ROLE_HOMEPAGES: Record<UserRole, string> = {
  admin: "/admin/clubs",
  coach: "/coach/dashboard",
  player: "/clubs",
};

/**
 * Get the homepage path for a given user role
 * Priority: admin > coach > player (for users with multiple roles, if applicable)
 * 
 * @param role User's role
 * @returns The homepage path for the role
 */
export function getRoleHomepage(role: UserRole | undefined): string {
  if (!role) {
    return ROLE_HOMEPAGES.player;
  }
  
  return ROLE_HOMEPAGES[role] ?? ROLE_HOMEPAGES.player;
}

/**
 * Determine redirect path based on user role with priority handling
 * Priority: admin > coach > player
 * 
 * @param role User's primary role
 * @returns The appropriate redirect path
 */
export function getRedirectPath(role: UserRole | undefined): string {
  // If role is admin, redirect to admin dashboard
  if (role === "admin") {
    return ROLE_HOMEPAGES.admin;
  }
  
  // If role is coach, redirect to coach dashboard
  if (role === "coach") {
    return ROLE_HOMEPAGES.coach;
  }
  
  // Default to player/clubs page
  return ROLE_HOMEPAGES.player;
}
