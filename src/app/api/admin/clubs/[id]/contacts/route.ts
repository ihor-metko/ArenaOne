import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAnyAdmin } from "@/lib/requireRole";
import { canAccessClub } from "@/lib/permissions/clubAccess";
import type { Address } from "@/types/address";

/**
 * PATCH /api/admin/clubs/[id]/contacts
 * Update club contact information
 */
export async function PATCH(
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

    const existingClub = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!existingClub) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    const body = await request.json();
    const { phone, email, website, address, location, city, country, latitude, longitude } = body;

    // Build update data object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (email !== undefined) updateData.email = email?.trim() || null;
    if (website !== undefined) updateData.website = website?.trim() || null;

    // Handle address updates - prefer new address object, fallback to legacy fields
    if (address !== undefined) {
      // If address object is provided, serialize it to JSON
      updateData.address = address ? JSON.stringify(address) : null;
      
      // Also update legacy fields for backward compatibility
      if (address) {
        const addr = address as Address;
        if (addr.formattedAddress !== undefined) updateData.location = addr.formattedAddress;
        if (addr.city !== undefined) updateData.city = addr.city;
        if (addr.country !== undefined) updateData.country = addr.country;
        if (addr.lat !== undefined) updateData.latitude = addr.lat;
        if (addr.lng !== undefined) updateData.longitude = addr.lng;
      }
    } else {
      // If legacy fields are provided, update both legacy fields and build address object
      let needsAddressUpdate = false;
      const addressObj: Address = {};
      
      if (location !== undefined) {
        updateData.location = location?.trim() || null;
        addressObj.formattedAddress = location?.trim() || null;
        needsAddressUpdate = true;
      }
      if (city !== undefined) {
        updateData.city = city?.trim() || null;
        addressObj.city = city?.trim() || null;
        needsAddressUpdate = true;
      }
      if (country !== undefined) {
        updateData.country = country?.trim() || null;
        addressObj.country = country?.trim() || null;
        needsAddressUpdate = true;
      }
      if (latitude !== undefined) {
        updateData.latitude = latitude;
        addressObj.lat = latitude;
        needsAddressUpdate = true;
      }
      if (longitude !== undefined) {
        updateData.longitude = longitude;
        addressObj.lng = longitude;
        needsAddressUpdate = true;
      }
      
      // If any legacy field was updated, also update the address object
      if (needsAddressUpdate) {
        // Merge with existing address data if available
        if (existingClub.address) {
          try {
            const existingAddress = JSON.parse(existingClub.address);
            updateData.address = JSON.stringify({ ...existingAddress, ...addressObj });
          } catch {
            updateData.address = JSON.stringify(addressObj);
          }
        } else {
          updateData.address = JSON.stringify(addressObj);
        }
      }
    }

    const updatedClub = await prisma.club.update({
      where: { id: clubId },
      data: updateData,
    });

    return NextResponse.json(updatedClub);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error updating club contacts:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
