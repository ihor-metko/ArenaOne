import { NextRequest, NextResponse } from "next/server";
import { requireAnyAdmin } from "@/lib/requireRole";
import { canAccessClub } from "@/lib/permissions/clubAccess";
import {
  validateUploadedFile,
  saveUploadedFile,
  getUploadedImageUrl,
} from "@/lib/fileUpload";

/**
 * POST /api/admin/clubs/[id]/images
 * Upload a gallery image for a club
 * 
 * @param request - The HTTP request containing the image file in FormData
 * @param params - Route parameters containing the club ID
 * @returns JSON with the uploaded image URL and key
 */
export async function POST(
  request: NextRequest,
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file
    const validationError = validateUploadedFile(file);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    // Save file to storage
    const filename = await saveUploadedFile(file, "clubs", clubId);

    // Generate URL and key
    const url = getUploadedImageUrl("clubs", clubId, filename);
    const key = filename;

    return NextResponse.json({
      url,
      key,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error uploading gallery image:", error);
    }
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
