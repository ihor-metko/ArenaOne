import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRootAdmin } from "@/lib/requireRole";
import type { TypedServer } from "@/types/socket";

/**
 * POST /api/admin/publication-requests/[id]/approve
 * 
 * Approve a club publication request and publish the club.
 * Only accessible by root admins.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRootAdmin(request);

  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const resolvedParams = await params;
    const requestId = resolvedParams.id;

    // Find the publication request
    const publicationRequest = await prisma.clubPublicationRequest.findUnique({
      where: { id: requestId },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            isPublic: true,
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!publicationRequest) {
      return NextResponse.json(
        { error: "Publication request not found" },
        { status: 404 }
      );
    }

    // Check if request is still pending
    if (publicationRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: `Request is already ${publicationRequest.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Update request status and publish the club in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update publication request
      const updatedRequest = await tx.clubPublicationRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          reviewedById: authResult.userId,
          reviewedAt: new Date(),
        },
        include: {
          club: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          requestedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Publish the club
      await tx.club.update({
        where: { id: publicationRequest.club.id },
        data: { isPublic: true },
      });

      return updatedRequest;
    });

    // Emit notification to the requester via Socket.IO
    if (global.io) {
      const io = global.io as TypedServer;
      
      const notificationPayload = {
        id: result.id,
        type: "CLUB_PUBLICATION_APPROVED" as const,
        clubId: result.club.id,
        clubName: result.club.name,
        approvedBy: result.reviewedBy?.name || result.reviewedBy?.email || "Root Admin",
        createdAt: new Date().toISOString(),
      };

      // Emit to the requester's room (if they're online)
      io.to(`user:${publicationRequest.requestedById}`).emit("club_publication_approved", notificationPayload);
      console.log("[ClubPublicationApproval] Notification sent to requester:", notificationPayload);
    }

    return NextResponse.json(result);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error approving publication request:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
