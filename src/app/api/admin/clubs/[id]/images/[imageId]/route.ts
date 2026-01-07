import { NextRequest, NextResponse } from "next/server";
import { requireAnyAdmin } from "@/lib/requireRole";
import { canAccessClub } from "@/lib/permissions/clubAccess";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/admin/clubs/[id]/images/[imageId]
 * Delete a gallery image
 * 
 * @param request - The HTTP request
 * @param params - Route parameters containing the club ID and image ID
 * @returns JSON with success status
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const authResult = await requireAnyAdmin(request);

  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const resolvedParams = await params;
    const clubId = resolvedParams.id;
    const imageId = resolvedParams.imageId;

    // Check access permission for organization admins, club owners, and club admins
    if (authResult.adminType !== "root_admin") {
      const hasAccess = await canAccessClub(
        authResult.adminType,
        authResult.managedIds,
        clubId
      );
      if (!hasAccess) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Verify the image belongs to the club
    const image = await prisma.clubGallery.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    if (image.clubId !== clubId) {
      return NextResponse.json(
        { error: "Image does not belong to this club" },
        { status: 403 }
      );
    }

    // Delete the image
    await prisma.clubGallery.delete({
      where: { id: imageId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error deleting gallery image:", error);
    }
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
