import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAdminType, AdminType } from "@/lib/requireRole";

/**
 * Admin Access Check API
 * 
 * Returns the admin type for the authenticated user.
 * Used by client-side components to check admin access.
 * 
 * Response:
 * - { isAdmin: true, adminType: "root" | "organization" | "club" } for admins
 * - { isAdmin: false, adminType: null } for non-admins
 * - 401 Unauthorized if not authenticated
 */

export interface AdminAccessResponse {
  isAdmin: boolean;
  adminType: AdminType;
}

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const adminType = await getAdminType(session.user.id, session.user.isRoot);

  const response: AdminAccessResponse = {
    isAdmin: adminType !== null,
    adminType,
  };

  return NextResponse.json(response);
}
