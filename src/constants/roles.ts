/**
 * Centralized Roles and permissions for the application.
 * 
 * The new permission model:
 * - Root Admin (isRoot=true on User) has global access to everything
 * - Membership roles (ORGANIZATION_ADMIN, MEMBER) define admin rights per organization
 * - ClubMembership roles (CLUB_ADMIN, MEMBER) define admin rights per club
 * - Regular users have no Membership record unless they are admins
 *
 * @example
 * import { MembershipRole, ClubMembershipRole } from "@/constants/roles";
 *
 * // Organization membership check
 * if (membership.role === MembershipRole.ORGANIZATION_ADMIN) { ... }
 *
 * // Club membership check  
 * if (clubMembership.role === ClubMembershipRole.CLUB_ADMIN) { ... }
 */

/**
 * Membership roles for Organization access
 */
export enum MembershipRole {
  ORGANIZATION_ADMIN = "ORGANIZATION_ADMIN",
  MEMBER = "MEMBER",
}

/**
 * Club membership roles for Club access
 */
export enum ClubMembershipRole {
  CLUB_ADMIN = "CLUB_ADMIN",
  MEMBER = "MEMBER",
}

/**
 * Type representing valid membership roles
 */
export type MembershipRoleType = `${MembershipRole}`;

/**
 * Type representing valid club membership roles
 */
export type ClubMembershipRoleType = `${ClubMembershipRole}`;

/**
 * Array of all valid membership roles.
 * Useful for validation and iteration.
 */
export const VALID_MEMBERSHIP_ROLES: MembershipRoleType[] = Object.values(MembershipRole);

/**
 * Array of all valid club membership roles.
 * Useful for validation and iteration.
 */
export const VALID_CLUB_MEMBERSHIP_ROLES: ClubMembershipRoleType[] = Object.values(ClubMembershipRole);

/**
 * Type guard to check if a value is a valid membership role.
 * @param role - The value to check
 * @returns true if the value is a valid MembershipRole
 */
export function isValidMembershipRole(role: unknown): role is MembershipRoleType {
  return typeof role === "string" && VALID_MEMBERSHIP_ROLES.includes(role as MembershipRoleType);
}

/**
 * Type guard to check if a value is a valid club membership role.
 * @param role - The value to check
 * @returns true if the value is a valid ClubMembershipRole
 */
export function isValidClubMembershipRole(role: unknown): role is ClubMembershipRoleType {
  return typeof role === "string" && VALID_CLUB_MEMBERSHIP_ROLES.includes(role as ClubMembershipRoleType);
}

// ============================================================================
// DEPRECATED: Legacy role system - kept for backward compatibility during migration
// These will be removed in a future version once all code is migrated to the new
// context-specific role system (Membership and ClubMembership)
// ============================================================================

/**
 * @deprecated Use isRoot on User model for root admin checks, 
 * MembershipRole for organization roles, and ClubMembershipRole for club roles.
 */
export enum Roles {
  RootAdmin = "root_admin",
  SuperAdmin = "super_admin",
  Admin = "admin",
  Coach = "coach",
  Player = "player",
}

/**
 * @deprecated Use MembershipRoleType or ClubMembershipRoleType instead
 */
export type UserRole = `${Roles}`;

/**
 * @deprecated Legacy roles array
 */
export const VALID_ROLES: UserRole[] = Object.values(Roles);

/**
 * @deprecated No longer applicable - roles are context-specific
 */
export const DEFAULT_ROLE: UserRole = Roles.Player;

/**
 * @deprecated Use isRoot on User model for admin checks
 */
export const ADMIN_ROLES: UserRole[] = [Roles.RootAdmin, Roles.SuperAdmin, Roles.Admin];

/**
 * @deprecated Use isRoot on User model for admin checks
 */
export function isAdminRole(role: unknown): boolean {
  return typeof role === "string" && ADMIN_ROLES.includes(role as UserRole);
}

/**
 * @deprecated Legacy role validation
 */
export function isValidRole(role: unknown): role is UserRole {
  return typeof role === "string" && VALID_ROLES.includes(role as UserRole);
}

/**
 * @deprecated Legacy role validation
 */
export function validateRole(role: unknown): UserRole {
  return isValidRole(role) ? role : DEFAULT_ROLE;
}
