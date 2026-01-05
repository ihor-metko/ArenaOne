import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireRole";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * PATCH /api/bookings/[id]
 * 
 * Update a booking (e.g., cancel it)
 * 
 * Body:
 * - status: string - New status for the booking
 * 
 * Returns:
 * - Updated booking information
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (!authResult.authorized) {
      return authResult.response;
    }

    const { id } = params;
    const body = await request.json();

    if (!body.status) {
      return NextResponse.json(
        { error: "status is required" },
        { status: 400 }
      );
    }

    // Update the booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: body.status,
      },
      include: {
        court: {
          include: {
            club: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        id: updatedBooking.id,
        status: updatedBooking.status,
        courtId: updatedBooking.courtId,
        start: updatedBooking.start.toISOString(),
        end: updatedBooking.end.toISOString(),
        price: updatedBooking.price,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
