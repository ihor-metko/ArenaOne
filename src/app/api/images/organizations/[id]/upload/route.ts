import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrganizationAdmin } from "@/lib/requireRole";
import { saveImageFile } from "@/lib/imageUpload";

/**
 * POST /api/images/organizations/[id]/upload
 * Upload images for a specific organization
 * 
 * Accepts multipart/form-data with:
 * - file: The image file (jpg, jpeg, png, webp)
 * - type: The image type ("logo" or "heroImage")
 * 
 * Authorization: Organization admin or root admin
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;

    // Check authorization
    const authResult = await requireOrganizationAdmin(organizationId);
    if (!authResult.authorized) {
      return authResult.response;
    }

    // Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!type || !["logo", "heroImage"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid or missing type. Must be 'logo' or 'heroImage'" },
        { status: 400 }
      );
    }

    // Save the image file
    const uploadResult = await saveImageFile(file);

    // Update the organization with the image URL
    const updateData: { logo?: string; heroImage?: string } = {};
    if (type === "logo") {
      updateData.logo = uploadResult.url;
    } else if (type === "heroImage") {
      updateData.heroImage = uploadResult.url;
    }

    await prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      filename: uploadResult.filename,
      type,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error uploading organization image:", error);
    }

    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
