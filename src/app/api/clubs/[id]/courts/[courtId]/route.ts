import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireRole";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; courtId: string }> }
) {
  const authResult = await requireRole(request, ["admin"]);

  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const resolvedParams = await params;
    const { id: clubId, courtId } = resolvedParams;

    // Check if court exists and belongs to the club
    const existingCourt = await prisma.court.findUnique({
      where: { id: courtId },
    });

    if (!existingCourt) {
      return NextResponse.json({ error: "Court not found" }, { status: 404 });
    }

    if (existingCourt.clubId !== clubId) {
      return NextResponse.json(
        { error: "Court does not belong to this club" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, slug, type, surface, indoor, defaultPriceCents, courtOpenTime, courtCloseTime } = body;

    // Validate name if provided
    if (name !== undefined && (typeof name !== "string" || name.trim() === "")) {
      return NextResponse.json(
        { error: "Name cannot be empty" },
        { status: 400 }
      );
    }

    // Validate court hours if provided
    if (courtOpenTime !== undefined && courtOpenTime !== null) {
      if (typeof courtOpenTime !== "number" || courtOpenTime < 0 || courtOpenTime > 23) {
        return NextResponse.json(
          { error: "courtOpenTime must be a number between 0 and 23" },
          { status: 400 }
        );
      }
    }

    if (courtCloseTime !== undefined && courtCloseTime !== null) {
      if (typeof courtCloseTime !== "number" || courtCloseTime < 0 || courtCloseTime > 24) {
        return NextResponse.json(
          { error: "courtCloseTime must be a number between 0 and 24" },
          { status: 400 }
        );
      }
    }

    // Determine effective open/close times for validation
    const effectiveOpenTime = courtOpenTime !== undefined ? courtOpenTime : existingCourt.courtOpenTime;
    const effectiveCloseTime = courtCloseTime !== undefined ? courtCloseTime : existingCourt.courtCloseTime;

    if (effectiveOpenTime !== null && effectiveCloseTime !== null && effectiveOpenTime >= effectiveCloseTime) {
      return NextResponse.json(
        { error: "courtOpenTime must be before courtCloseTime" },
        { status: 400 }
      );
    }

    // Check for slug uniqueness if provided and different from current
    if (slug && slug !== existingCourt.slug) {
      const existingSlugCourt = await prisma.court.findUnique({
        where: { slug },
      });
      if (existingSlugCourt && existingSlugCourt.id !== courtId) {
        return NextResponse.json(
          { error: "A court with this slug already exists" },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (slug !== undefined) updateData.slug = slug?.trim() || null;
    if (type !== undefined) updateData.type = type?.trim() || null;
    if (surface !== undefined) updateData.surface = surface?.trim() || null;
    if (indoor !== undefined) updateData.indoor = indoor;
    if (defaultPriceCents !== undefined) updateData.defaultPriceCents = defaultPriceCents;
    if (courtOpenTime !== undefined) updateData.courtOpenTime = courtOpenTime;
    if (courtCloseTime !== undefined) updateData.courtCloseTime = courtCloseTime;

    const updatedCourt = await prisma.court.update({
      where: { id: courtId },
      data: updateData,
    });

    return NextResponse.json(updatedCourt);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error updating court:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; courtId: string }> }
) {
  const authResult = await requireRole(request, ["admin"]);

  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const resolvedParams = await params;
    const { id: clubId, courtId } = resolvedParams;

    // Check if court exists and belongs to the club
    const existingCourt = await prisma.court.findUnique({
      where: { id: courtId },
    });

    if (!existingCourt) {
      return NextResponse.json({ error: "Court not found" }, { status: 404 });
    }

    if (existingCourt.clubId !== clubId) {
      return NextResponse.json(
        { error: "Court does not belong to this club" },
        { status: 404 }
      );
    }

    await prisma.court.delete({
      where: { id: courtId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error deleting court:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
