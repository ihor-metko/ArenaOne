import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRootAdmin } from "@/lib/requireRole";
import type { TypedServer } from "@/types/socket";

/**
 * POST /api/admin/publication-requests/[id]/reject
 * 
 * Reject a club publication request.
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
    const body = await request.json();
    const { reason } = body;

    // Find the publication request
    const publicationRequest = await prisma.clubPublicationRequest.findUnique({
      where: { id: requestId },
      include: {
        club: {
          select: {
            id: true,
            name: true,
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

    // Update request status to rejected
    const updatedRequest = await prisma.clubPublicationRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        reviewedById: authResult.userId,
        reviewedAt: new Date(),
        rejectionReason: reason || null,
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

    // Emit notification to the requester via Socket.IO
    if (global.io) {
      const io = global.io as TypedServer;
      
      const notificationPayload = {
        id: updatedRequest.id,
        type: "CLUB_PUBLICATION_REJECTED" as const,
        clubId: updatedRequest.club.id,
        clubName: updatedRequest.club.name,
        rejectedBy: updatedRequest.reviewedBy?.name || updatedRequest.reviewedBy?.email || "Root Admin",
        reason: updatedRequest.rejectionReason,
        createdAt: new Date().toISOString(),
      };

      // Emit to the requester's room (if they're online)
      io.to(`user:${publicationRequest.requestedById}`).emit("club_publication_rejected", notificationPayload);
      console.log("[ClubPublicationRejection] Notification sent to requester:", notificationPayload);
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error rejecting publication request:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
