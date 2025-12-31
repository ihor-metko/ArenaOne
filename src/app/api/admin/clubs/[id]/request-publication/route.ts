import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAnyAdmin } from "@/lib/requireRole";
import { notificationEmitter, NotificationPayload } from "@/lib/notificationEmitter";
import type { TypedServer } from "@/types/socket";

/**
 * POST /api/admin/clubs/[id]/request-publication
 * 
 * Request publication of a club. Only organization admins can request publication.
 * Root admins can directly publish via the section endpoint.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAnyAdmin(request);

  if (!authResult.authorized) {
    return authResult.response;
  }

  // Only organization admins need to request publication
  // Root admins can publish directly
  if (authResult.adminType === "root_admin") {
    return NextResponse.json(
      { error: "Root admins can publish clubs directly via the section endpoint" },
      { status: 400 }
    );
  }

  // Club admins and club owners cannot request publication
  if (authResult.adminType === "club_admin" || authResult.adminType === "club_owner") {
    return NextResponse.json(
      { error: "Only organization admins can request club publication" },
      { status: 403 }
    );
  }

  try {
    const resolvedParams = await params;
    const clubId = resolvedParams.id;

    // Verify club exists and belongs to an organization the admin manages
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        id: true,
        name: true,
        organizationId: true,
        isPublic: true,
      },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // Verify org admin has access to this club's organization
    if (!club.organizationId || !authResult.managedIds.includes(club.organizationId)) {
      return NextResponse.json(
        { error: "You do not have permission to request publication for this club" },
        { status: 403 }
      );
    }

    // Check if club is already public
    if (club.isPublic) {
      return NextResponse.json(
        { error: "Club is already published" },
        { status: 400 }
      );
    }

    // Check if there's already a pending request for this club
    const existingRequest = await prisma.clubPublicationRequest.findFirst({
      where: {
        clubId,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "A publication request is already pending for this club" },
        { status: 409 }
      );
    }

    // Create the publication request
    const publicationRequest = await prisma.clubPublicationRequest.create({
      data: {
        clubId,
        requestedById: authResult.userId,
        status: "PENDING",
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            organizationId: true,
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

    // Emit notification to root admins via Socket.IO
    if (global.io) {
      const io = global.io as TypedServer;
      
      const notificationPayload = {
        id: publicationRequest.id,
        type: "CLUB_PUBLICATION_REQUEST" as const,
        clubId: publicationRequest.clubId,
        clubName: publicationRequest.club.name,
        requestedBy: publicationRequest.requestedBy.name || publicationRequest.requestedBy.email,
        requestedById: publicationRequest.requestedById,
        createdAt: publicationRequest.createdAt.toISOString(),
      };

      // Emit to root admins room
      io.to("root_admin").emit("club_publication_request", notificationPayload);
      console.log("[ClubPublicationRequest] Notification sent to root_admin room:", notificationPayload);
    }

    // Also emit to SSE listeners (if notification emitter supports it)
    try {
      const ssePayload: NotificationPayload = {
        id: publicationRequest.id,
        type: "REQUESTED",
        playerId: authResult.userId,
        coachId: authResult.userId, // Reusing existing fields
        summary: `Publication requested for ${publicationRequest.club.name}`,
        createdAt: publicationRequest.createdAt.toISOString(),
      };
      notificationEmitter.emit(ssePayload);
    } catch (error) {
      // Non-critical, log but don't fail the request
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to emit SSE notification:", error);
      }
    }

    return NextResponse.json(publicationRequest, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error creating publication request:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
