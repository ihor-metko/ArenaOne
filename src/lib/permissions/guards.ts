/**
 * API Guards - Reusable Authorization Guards for API Routes
 * 
 * This module provides composable guards that:
 * - Extract authenticated user from session
 * - Validate permissions using centralized permission utilities
 * - Throw consistent authorization errors
 * - Are reusable by API routes, server actions, and middleware
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  isRootAdmin,
  canAccessOrganization,
  canManageOrganization,
  canAccessClub,
  canManageClub,
} from "./index";

/**
 * Guard result type for authorized requests.
 */
export interface GuardSuccess {
  authorized: true;
  userId: string;
  isRoot: boolean;
}

/**
 * Guard result type for unauthorized requests.
 */
export interface GuardFailure {
  authorized: false;
  response: NextResponse;
}

/**
 * Result type for guard functions.
 */
export type GuardResult = GuardSuccess | GuardFailure;

/**
 * Require that the user is authenticated as a root admin.
 * 
 * @returns Guard result with user info or error response
 * 
 * @example
 * const authResult = await requireRootAdmin();
 * if (!authResult.authorized) return authResult.response;
 * const { userId } = authResult;
 */
export async function requireRootAdmin(): Promise<GuardResult> {
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

  if (!isRootAdmin(session.user)) {
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
    isRoot: true,
  };
}

/**
 * Require that the user can access (read) an organization.
 * 
 * Access granted to:
 * - Root admins
 * - Organization members (any role)
 * 
 * @param organizationId - Organization ID to check access for
 * @returns Guard result with user info or error response
 * 
 * @example
 * const authResult = await requireOrganizationAccess(organizationId);
 * if (!authResult.authorized) return authResult.response;
 * const { userId, isRoot } = authResult;
 */
export async function requireOrganizationAccess(
  organizationId: string
): Promise<GuardResult> {
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

  const user = session.user;
  const hasAccess = await canAccessOrganization(user, organizationId);

  if (!hasAccess) {
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
    userId: user.id,
    isRoot: user.isRoot ?? false,
  };
}

/**
 * Require that the user can manage (update/delete) an organization.
 * 
 * Access granted to:
 * - Root admins
 * - Organization admins (including owners)
 * 
 * @param organizationId - Organization ID to check admin access for
 * @returns Guard result with user info or error response
 * 
 * @example
 * const authResult = await requireOrganizationAdmin(organizationId);
 * if (!authResult.authorized) return authResult.response;
 * const { userId, isRoot } = authResult;
 */
export async function requireOrganizationAdmin(
  organizationId: string
): Promise<GuardResult> {
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

  const user = session.user;
  const canManage = await canManageOrganization(user, organizationId);

  if (!canManage) {
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
    userId: user.id,
    isRoot: user.isRoot ?? false,
  };
}

/**
 * Require that the user can access (read) a club.
 * 
 * Access granted to:
 * - Root admins
 * - Organization admins (for clubs in their organization)
 * - Club members (any role)
 * 
 * @param clubId - Club ID to check access for
 * @returns Guard result with user info or error response
 * 
 * @example
 * const authResult = await requireClubAccess(clubId);
 * if (!authResult.authorized) return authResult.response;
 * const { userId, isRoot } = authResult;
 */
export async function requireClubAccess(
  clubId: string
): Promise<GuardResult> {
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

  const user = session.user;
  const hasAccess = await canAccessClub(user, clubId);

  if (!hasAccess) {
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
    userId: user.id,
    isRoot: user.isRoot ?? false,
  };
}

/**
 * Require that the user can manage (update/delete) a club.
 * 
 * Access granted to:
 * - Root admins
 * - Organization admins (for clubs in their organization)
 * - Club owners
 * - Club admins
 * 
 * @param clubId - Club ID to check admin access for
 * @returns Guard result with user info or error response
 * 
 * @example
 * const authResult = await requireClubAdmin(clubId);
 * if (!authResult.authorized) return authResult.response;
 * const { userId, isRoot } = authResult;
 */
export async function requireClubAdmin(
  clubId: string
): Promise<GuardResult> {
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

  const user = session.user;
  const canManage = await canManageClub(user, clubId);

  if (!canManage) {
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
    userId: user.id,
    isRoot: user.isRoot ?? false,
  };
}
