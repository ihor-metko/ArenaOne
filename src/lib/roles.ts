/**
 * Centralized Roles definitions
 *
 * This module re-exports role-related types and constants from @/constants/roles.
 * Import from this module to ensure consistent role handling across the codebase.
 * 
 * New role model:
 * - Root Admin: identified by User.isRoot = true (global access)
 * - Organization Admin: Membership with role = ORGANIZATION_ADMIN
 * - Club Admin: ClubMembership with role = CLUB_ADMIN
 */

// Re-export all from constants/roles for backward compatibility
export {
  MembershipRole,
  ClubMembershipRole,
  type MembershipRoleType,
  type ClubMembershipRoleType,
  VALID_MEMBERSHIP_ROLES,
  VALID_CLUB_MEMBERSHIP_ROLES,
  isValidMembershipRole,
  isValidClubMembershipRole,
  // Legacy exports (deprecated)
  Roles,
  type UserRole,
  VALID_ROLES,
  DEFAULT_ROLE,
  ADMIN_ROLES,
  isAdminRole,
  isValidRole,
  validateRole,
} from "@/constants/roles";
