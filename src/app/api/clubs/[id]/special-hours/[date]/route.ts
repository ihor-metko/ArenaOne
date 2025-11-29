import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireRole";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; date: string }> }
) {
  // Require admin role
  const authResult = await requireRole(request, ["admin"]);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const resolvedParams = await params;
    const { id: clubId, date: dateParam } = resolvedParams;

    // Validate date
    const targetDate = new Date(`${dateParam}T00:00:00.000Z`);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Check if club exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // Check if special hours exist
    const specialHours = await prisma.clubSpecialHours.findUnique({
      where: {
        clubId_date: {
          clubId,
          date: targetDate,
        },
      },
    });

    if (!specialHours) {
      return NextResponse.json(
        { error: "Special hours not found for this date" },
        { status: 404 }
      );
    }

    // Delete special hours
    await prisma.clubSpecialHours.delete({
      where: {
        clubId_date: {
          clubId,
          date: targetDate,
        },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error deleting special hours:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
