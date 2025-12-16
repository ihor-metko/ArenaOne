import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAnyAdmin, requireClubOwner } from "@/lib/requireRole";
import { ClubMembershipRole } from "@/constants/roles";

/**
 * Check if an admin can manage payment keys for a specific club
 * Only Club Owners and Root Admins can manage payment keys
 */
async function canManagePaymentKeys(
  adminType: "root_admin" | "organization_admin" | "club_owner" | "club_admin",
  managedIds: string[],
  clubId: string
): Promise<boolean> {
  if (adminType === "root_admin") {
    return true;
  }

  if (adminType === "club_owner") {
    return managedIds.includes(clubId);
  }

  // Organization admins and club admins cannot manage payment keys
  return false;
}

/**
 * GET /api/admin/clubs/[id]/payment-keys
 * 
 * Get payment keys for a club.
 * Only Club Owners and Root Admins can access this endpoint.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAnyAdmin(request);

  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const resolvedParams = await params;
    const clubId = resolvedParams.id;

    // Check if user can manage payment keys
    if (!canManagePaymentKeys(authResult.adminType, authResult.managedIds, clubId)) {
      return NextResponse.json(
        { error: "Only Club Owners can view payment keys" },
        { status: 403 }
      );
    }

    // Fetch club with payment keys
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        id: true,
        name: true,
        wayforpayKey: true,
        liqpayKey: true,
      },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    return NextResponse.json({
      clubId: club.id,
      clubName: club.name,
      wayforpayKey: club.wayforpayKey,
      liqpayKey: club.liqpayKey,
    });
  } catch (error) {
    console.error("Error fetching payment keys:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment keys" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/clubs/[id]/payment-keys
 * 
 * Update payment keys for a club.
 * Only Club Owners and Root Admins can update payment keys.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAnyAdmin(request);

  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const resolvedParams = await params;
    const clubId = resolvedParams.id;

    // Check if user can manage payment keys
    if (!canManagePaymentKeys(authResult.adminType, authResult.managedIds, clubId)) {
      return NextResponse.json(
        { error: "Only Club Owners can update payment keys" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { wayforpayKey, liqpayKey } = body;

    // Validate that at least one key is provided
    if (wayforpayKey === undefined && liqpayKey === undefined) {
      return NextResponse.json(
        { error: "At least one payment key must be provided" },
        { status: 400 }
      );
    }

    // Validate keys (basic validation - adjust as needed)
    if (wayforpayKey !== undefined && wayforpayKey !== null && typeof wayforpayKey !== "string") {
      return NextResponse.json(
        { error: "Invalid WayForPay key format" },
        { status: 400 }
      );
    }

    if (liqpayKey !== undefined && liqpayKey !== null && typeof liqpayKey !== "string") {
      return NextResponse.json(
        { error: "Invalid LiqPay key format" },
        { status: 400 }
      );
    }

    // Update club payment keys
    const updateData: { wayforpayKey?: string | null; liqpayKey?: string | null } = {};
    if (wayforpayKey !== undefined) {
      updateData.wayforpayKey = wayforpayKey;
    }
    if (liqpayKey !== undefined) {
      updateData.liqpayKey = liqpayKey;
    }

    const updatedClub = await prisma.club.update({
      where: { id: clubId },
      data: updateData,
      select: {
        id: true,
        name: true,
        wayforpayKey: true,
        liqpayKey: true,
      },
    });

    return NextResponse.json({
      message: "Payment keys updated successfully",
      clubId: updatedClub.id,
      clubName: updatedClub.name,
      wayforpayKey: updatedClub.wayforpayKey,
      liqpayKey: updatedClub.liqpayKey,
    });
  } catch (error) {
    console.error("Error updating payment keys:", error);
    return NextResponse.json(
      { error: "Failed to update payment keys" },
      { status: 500 }
    );
  }
}
