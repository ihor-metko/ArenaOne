import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClubAccess } from "@/lib/requireRole";
import { auditLog, AuditAction, TargetType } from "@/lib/auditLog";
import { ClubMembershipRole } from "@/constants/roles";
import { hash } from "bcryptjs";

/**
 * GET /api/admin/clubs/[id]/admins
 * Returns list of Club Admins for a specific club.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const clubId = resolvedParams.id;

    // Check access - only root and org admins can view club admins list
    const authResult = await requireClubAccess(clubId, { allowClubAdmin: false });

    if (!authResult.authorized) {
      // Log unauthorized access attempt
      await auditLog(
        authResult.userId || "unknown",
        AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
        TargetType.CLUB,
        clubId,
        {
          attemptedPath: `/api/admin/clubs/${clubId}/admins`,
          method: "GET",
        }
      );
      return authResult.response;
    }

    const clubAdmins = await prisma.clubMembership.findMany({
      where: {
        clubId,
        role: ClubMembershipRole.CLUB_ADMIN,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const formattedAdmins = clubAdmins.map((cm) => ({
      id: cm.user.id,
      name: cm.user.name,
      email: cm.user.email,
    }));

    return NextResponse.json(formattedAdmins);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching club admins:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/clubs/[id]/admins
 * Adds a Club Admin to a specific club.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const clubId = resolvedParams.id;

    // Check access - only root and org admins can add club admins
    const authResult = await requireClubAccess(clubId, { allowClubAdmin: false });

    if (!authResult.authorized) {
      // Log unauthorized access attempt
      await auditLog(
        authResult.userId || "unknown",
        AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
        TargetType.CLUB,
        clubId,
        {
          attemptedPath: `/api/admin/clubs/${clubId}/admins`,
          method: "POST",
        }
      );
      return authResult.response;
    }

    const body = await request.json();
    const { userId, createNew, name, email, password } = body;

    let targetUserId: string;

    if (createNew) {
      // Create a new user as Club Admin
      if (!name || !email || !password) {
        return NextResponse.json(
          { error: "Name, email, and password are required for new user" },
          { status: 400 }
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 409 }
        );
      }

      // Validate password length
      if (password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }

      // Create the new user
      const hashedPassword = await hash(password, 12);
      const newUser = await prisma.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase(),
          password: hashedPassword,
        },
      });

      targetUserId = newUser.id;
    } else {
      // Use existing user
      if (!userId) {
        return NextResponse.json(
          { error: "User ID is required" },
          { status: 400 }
        );
      }

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      targetUserId = userId;
    }

    // Check if already assigned to this club as CLUB_ADMIN
    const existingMembership = await prisma.clubMembership.findUnique({
      where: {
        userId_clubId: {
          userId: targetUserId,
          clubId,
        },
      },
    });

    if (existingMembership && existingMembership.role === ClubMembershipRole.CLUB_ADMIN) {
      return NextResponse.json(
        { error: "User is already a Club Admin of this club" },
        { status: 409 }
      );
    }

    if (existingMembership) {
      // Update existing membership to CLUB_ADMIN
      await prisma.clubMembership.update({
        where: { id: existingMembership.id },
        data: { role: ClubMembershipRole.CLUB_ADMIN },
      });
    } else {
      // Create new membership
      await prisma.clubMembership.create({
        data: {
          userId: targetUserId,
          clubId,
          role: ClubMembershipRole.CLUB_ADMIN,
        },
      });
    }

    // Fetch the updated user info
    const assignedUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Club Admin assigned successfully",
        clubAdmin: assignedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error assigning Club Admin:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/clubs/[id]/admins
 * Removes a Club Admin from a specific club.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const clubId = resolvedParams.id;

    // Check access - only root and org admins can remove club admins
    const authResult = await requireClubAccess(clubId, { allowClubAdmin: false });

    if (!authResult.authorized) {
      // Log unauthorized access attempt
      await auditLog(
        authResult.userId || "unknown",
        AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
        TargetType.CLUB,
        clubId,
        {
          attemptedPath: `/api/admin/clubs/${clubId}/admins`,
          method: "DELETE",
        }
      );
      return authResult.response;
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Find the membership to remove
    const targetMembership = await prisma.clubMembership.findUnique({
      where: {
        userId_clubId: {
          userId,
          clubId,
        },
      },
    });

    if (!targetMembership || targetMembership.role !== ClubMembershipRole.CLUB_ADMIN) {
      return NextResponse.json(
        { error: "User is not a Club Admin of this club" },
        { status: 400 }
      );
    }

    // Delete the membership
    await prisma.clubMembership.delete({
      where: { id: targetMembership.id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Club Admin removed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error removing Club Admin:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
