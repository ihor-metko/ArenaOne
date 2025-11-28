import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireRole";

export async function GET(request: Request) {
  const authResult = await requireRole(request, ["admin"]);

  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const clubs = await prisma.club.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        location: true,
        contactInfo: true,
        openingHours: true,
        logo: true,
        createdAt: true,
      },
    });

    return NextResponse.json(clubs);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching clubs:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authResult = await requireRole(request, ["admin"]);

  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    const { name, location, contactInfo, openingHours, logo } = body;

    if (!name || !location) {
      return NextResponse.json(
        { error: "Name and location are required" },
        { status: 400 }
      );
    }

    const club = await prisma.club.create({
      data: {
        name,
        location,
        contactInfo: contactInfo || null,
        openingHours: openingHours || null,
        logo: logo || null,
      },
    });

    return NextResponse.json(club, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error creating club:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
