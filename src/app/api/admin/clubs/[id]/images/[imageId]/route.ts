import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireRole";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const authResult = await requireRole(request, ["admin"]);

  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const resolvedParams = await params;
    const clubId = resolvedParams.id;
    const imageId = resolvedParams.imageId;

    // Check if club exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // Check if image exists and belongs to this club
    const image = await prisma.clubGallery.findFirst({
      where: {
        id: imageId,
        clubId,
      },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // In production, this would also delete from cloud storage
    // Delete the gallery record
    await prisma.clubGallery.delete({
      where: { id: imageId },
    });

    return NextResponse.json({ message: "Image deleted successfully" });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error deleting club image:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
