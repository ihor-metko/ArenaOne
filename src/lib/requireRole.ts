import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MembershipRole, ClubMembershipRole } from "@/constants/roles";

/**
 * Extended Request interface with authenticated user information.
 */
export interface AuthenticatedRequest extends Request {
  userId?: string;
  isRoot?: boolean;
}

/**
 * Admin type for identifying the type of admin access.
 */
export type AdminType = "root" | "organization" | "club" | null;

/**
 * Middleware to require root admin access for API routes.
 * 
 * In the new role structure, global access is controlled by the isRoot field.
 * For organization/club-specific access, use requireOrganizationAdmin or requireClubAdmin.
 *
 * @example
 * const authResult = await requireRootAdmin(request);
 * if (!authResult.authorized) return authResult.response;
 */
export async function requireRootAdmin(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _request: Request
): Promise<{ authorized: true; userId: string } | { authorized: false; response: NextResponse }> {
  const session = await auth();

  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  if (!session.user.isRoot) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    userId: session.user.id,
  };
}

/**
 * Middleware to require authenticated user for API routes.
 * This only checks if the user is authenticated, not their role.
 *
 * @example
 * const authResult = await requireAuth(request);
 * if (!authResult.authorized) return authResult.response;
 */
export async function requireAuth(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _request: Request
): Promise<{ authorized: true; userId: string; isRoot: boolean } | { authorized: false; response: NextResponse }> {
  const session = await auth();

  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  return {
    authorized: true,
    userId: session.user.id,
    isRoot: session.user.isRoot ?? false,
  };
}

/**
 * @deprecated This function is deprecated. Use requireRootAdmin or requireAuth instead.
 * Kept for backward compatibility with archived features.
 * 
 * In the new role structure:
 * - Root admins are identified by isRoot=true
 * - Organization/club roles are context-specific via Membership/ClubMembership
 */
export async function requireRole(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _request: Request,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _allowedRoles: string[]
): Promise<{ authorized: true; userId: string; userRole: string } | { authorized: false; response: NextResponse }> {
  const session = await auth();

  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  // In the new system, root admins have access to everything
  // For backward compatibility, we treat isRoot as having all roles
  const userRole = session.user.isRoot ? "root_admin" : "player";

  return {
    authorized: true,
    userId: session.user.id,
    userRole,
  };
}

/**
 * Check if a user is any type of admin (root, organization, or club admin).
 * This function queries the database to check membership roles.
 * 
 * @param userId The user ID to check
 * @returns AdminType indicating the type of admin, or null if not an admin
 */
export async function getAdminType(userId: string, isRoot?: boolean): Promise<AdminType> {
  // Root admin has the highest priority
  if (isRoot) {
    return "root";
  }

  // Check for organization admin role
  const orgMembership = await prisma.membership.findFirst({
    where: {
      userId,
      role: MembershipRole.ORGANIZATION_ADMIN,
    },
  });

  if (orgMembership) {
    return "organization";
  }

  // Check for club admin role
  const clubMembership = await prisma.clubMembership.findFirst({
    where: {
      userId,
      role: ClubMembershipRole.CLUB_ADMIN,
    },
  });

  if (clubMembership) {
    return "club";
  }

  return null;
}

/**
 * Middleware to require any admin access (root, organization, or club admin) for API routes.
 * 
 * This checks:
 * 1. Root admin via isRoot=true
 * 2. Organization admin via Membership with ORGANIZATION_ADMIN role
 * 3. Club admin via ClubMembership with CLUB_ADMIN role
 *
 * @example
 * const authResult = await requireAnyAdmin(request);
 * if (!authResult.authorized) return authResult.response;
 */
export async function requireAnyAdmin(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _request: Request
): Promise<{ authorized: true; userId: string; adminType: AdminType } | { authorized: false; response: NextResponse }> {
  const session = await auth();

  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const adminType = await getAdminType(session.user.id, session.user.isRoot);

  if (!adminType) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    userId: session.user.id,
    adminType,
  };
}
