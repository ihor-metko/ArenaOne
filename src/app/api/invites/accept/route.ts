/**
 * POST /api/invites/accept - Accept Invite Endpoint
 * 
 * Accepts an invite and creates the appropriate membership.
 * Must be called by an authenticated user.
 * 
 * Request body:
 * - token: string (required) - The invite token to accept
 * 
 * Security:
 * - Requires authentication
 * - Validates token using constant-time comparison
 * - Checks expiration and status
 * - Creates membership in a transaction
 * - Marks invite as accepted
 * - Invalidates token (status change + acceptedAt)
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { prisma } from "@/lib/prisma";
import { hashInviteToken, isInviteExpired, verifyInviteToken } from "@/lib/inviteUtils";
import { mapInviteRoleToMembershipRole } from "@/lib/inviteHelpers";

export async function POST(request: Request) {
  // 1. Get the current authenticated user from the database
  const userResult = await getCurrentUser();
  if (!userResult.authorized) {
    return userResult.response;
  }

  const currentUser = userResult.user;

  try {
    // 2. Parse request body
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // 3. Hash the token to look up in database
    const tokenHash = hashInviteToken(token);

    // 4. Find and validate invite (with user info for email check)
    const invite = await prisma.invite.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        email: true,
        role: true,
        organizationId: true,
        clubId: true,
        status: true,
        expiresAt: true,
        tokenHash: true,
        invitedByUserId: true,
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid invite token" },
        { status: 404 }
      );
    }

    // 5. Verify token using constant-time comparison
    if (!verifyInviteToken(token, invite.tokenHash)) {
      return NextResponse.json(
        { error: "Invalid invite token" },
        { status: 404 }
      );
    }

    // 6. Check if already accepted
    if (invite.status === "ACCEPTED") {
      return NextResponse.json(
        { error: "This invite has already been accepted" },
        { status: 410 }
      );
    }

    // 7. Check if revoked
    if (invite.status === "REVOKED") {
      return NextResponse.json(
        { error: "This invite has been revoked" },
        { status: 410 }
      );
    }

    // 8. Check if expired
    if (invite.status === "EXPIRED" || isInviteExpired(invite.expiresAt)) {
      return NextResponse.json(
        { error: "This invite has expired" },
        { status: 410 }
      );
    }

    // 9. Get current user's email (we already have the full user from getCurrentUser)
    // 10. Validate that the user's email matches the invite email
    if (currentUser.email.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        { error: "This invite is for a different email address" },
        { status: 403 }
      );
    }

    // 11. Map invite role to membership role
    const { type, role, isPrimaryOwner } = mapInviteRoleToMembershipRole(invite.role);

    // 12. Execute in transaction: create membership + mark invite as accepted
    const result = await prisma.$transaction(async (tx) => {
      // Create appropriate membership
      if (type === "organization") {
        if (!invite.organizationId) {
          throw new Error("Organization ID is required for organization role");
        }

        // Check for existing membership
        const existingMembership = await tx.membership.findUnique({
          where: {
            userId_organizationId: {
              userId: currentUser.id,
              organizationId: invite.organizationId,
            },
          },
        });

        if (existingMembership) {
          throw new Error("You are already a member of this organization");
        }

        // Type assertion: role is MembershipRole when type is "organization"
        const membershipRole = role as import("@/constants/roles").MembershipRole;

        // Create organization membership
        const membership = await tx.membership.create({
          data: {
            userId: currentUser.id,
            organizationId: invite.organizationId,
            role: membershipRole,
            isPrimaryOwner: isPrimaryOwner || false,
          },
        });

        // Mark invite as accepted
        await tx.invite.update({
          where: { id: invite.id },
          data: {
            status: "ACCEPTED",
            acceptedAt: new Date(),
            acceptedByUserId: currentUser.id,
          },
        });

        return { membership, type: "organization" as const };
      } else {
        // type === "club"
        if (!invite.clubId) {
          throw new Error("Club ID is required for club role");
        }

        // Check for existing membership
        const existingMembership = await tx.clubMembership.findUnique({
          where: {
            userId_clubId: {
              userId: currentUser.id,
              clubId: invite.clubId,
            },
          },
        });

        if (existingMembership) {
          throw new Error("You are already a member of this club");
        }

        // Type assertion: role is ClubMembershipRole when type is "club"
        const clubRole = role as import("@/constants/roles").ClubMembershipRole;

        // Create club membership
        const membership = await tx.clubMembership.create({
          data: {
            userId: currentUser.id,
            clubId: invite.clubId,
            role: clubRole,
          },
        });

        // Mark invite as accepted
        await tx.invite.update({
          where: { id: invite.id },
          data: {
            status: "ACCEPTED",
            acceptedAt: new Date(),
            acceptedByUserId: currentUser.id,
          },
        });

        return { membership, type: "club" as const };
      }
    });

    // 13. Return success response
    return NextResponse.json({
      success: true,
      message: "Invite accepted successfully",
      membership: {
        id: result.membership.id,
        role: result.membership.role,
        type: result.type,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error accepting invite:", error);
    }

    // Check for specific error messages from transaction
    if (error instanceof Error) {
      if (error.message.includes("already a member")) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
