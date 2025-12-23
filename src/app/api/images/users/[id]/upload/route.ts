import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireRole";
import { saveImageFile } from "@/lib/imageUpload";

/**
 * POST /api/images/users/[id]/upload
 * Upload profile image for a specific user
 * 
 * Accepts multipart/form-data with:
 * - file: The image file (jpg, jpeg, png, webp)
 * 
 * Authorization: User can only upload their own profile image, unless they are root admin
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Check authorization
    const authResult = await requireAuth(request);
    if (!authResult.authorized) {
      return authResult.response;
    }

    // Users can only upload their own image unless they are root admin
    if (authResult.userId !== userId && !authResult.isRoot) {
      return NextResponse.json(
        { error: "Forbidden - You can only upload your own profile image" },
        { status: 403 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
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

    // Save the image file
    const uploadResult = await saveImageFile(file);

    // Update the user with the image URL
    await prisma.user.update({
      where: { id: userId },
      data: { image: uploadResult.url },
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      filename: uploadResult.filename,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error uploading user image:", error);
    }

    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
