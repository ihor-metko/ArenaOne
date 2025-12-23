import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRootAdmin } from "@/lib/requireRole";
import { randomUUID } from "crypto";
import {
  uploadToStorage,
  uploadLogoToStorage,
  validateLogoFileForUpload,
  validateFileForUpload,
  getExtensionForMimeType,
  isSupabaseStorageConfigured,
} from "@/lib/supabase";

/**
 * POST /api/admin/organizations/[id]/images
 * Upload an image for an organization to Supabase Storage
 * 
 * Images are stored in the "uploads" bucket with the path:
 * organizations/{organizationId}/{uuid}.{ext}
 * 
 * This follows the same pattern as club images: clubs/{clubId}/{uuid}.{ext}
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRootAdmin(request);

  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const resolvedParams = await params;
    const organizationId = resolvedParams.id;

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const imageType = formData.get("type") as string | null; // "logo" or "heroImage"

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!imageType || !["logo", "heroImage"].includes(imageType)) {
      return NextResponse.json(
        { error: "Invalid image type. Must be 'logo' or 'heroImage'" },
        { status: 400 }
      );
    }

    // Validate file type and size based on image type
    // SVG is only allowed for logos, not for heroImage
    const validationError = imageType === "logo"
      ? validateLogoFileForUpload(file.type, file.size)
      : validateFileForUpload(file.type, file.size);
    
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    // Generate unique key for the file using validated extension from MIME type
    const extension = getExtensionForMimeType(file.type);
    // Path inside the bucket: organizations/{organizationId}/{uuid}.{ext}
    const imageKey = `organizations/${organizationId}/${randomUUID()}.${extension}`;

    let imageUrl: string;

    // Upload to Supabase Storage if configured, otherwise use mock URL
    if (isSupabaseStorageConfigured()) {
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Use uploadLogoToStorage for logos (supports SVG with sanitization)
      // Use regular upload for heroImage (no SVG support)
      const uploadResult = imageType === "logo"
        ? await uploadLogoToStorage(imageKey, buffer, file.type)
        : await uploadToStorage(imageKey, buffer, file.type);

      if ("error" in uploadResult) {
        console.error("Failed to upload to Supabase Storage:", uploadResult.error);
        return NextResponse.json(
          { error: `Upload failed: ${uploadResult.error}` },
          { status: 500 }
        );
      }

      // uploadResult.path contains the relative path (e.g., "organizations/{organizationId}/{uuid}.jpg")
      // Store this relative path in the database
      // The getSupabaseStorageUrl utility will convert it to a full URL when needed
      imageUrl = uploadResult.path;
    } else {
      // Development fallback: store as mock URL
      console.warn("Supabase Storage not configured, using mock URL");
      imageUrl = `/uploads/${imageKey}`;
    }

    // Update the organization with the new image URL
    const updateData = imageType === "logo" 
      ? { logo: imageUrl }
      : { heroImage: imageUrl };

    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
    });

    return NextResponse.json(
      {
        url: imageUrl,
        key: imageKey,
        type: imageType,
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
        organization: {
          id: updatedOrganization.id,
          logo: updatedOrganization.logo,
          heroImage: updatedOrganization.heroImage,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading organization image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
