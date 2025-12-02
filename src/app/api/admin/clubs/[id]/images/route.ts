import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireRole";
import { randomUUID } from "crypto";

// Allowed file types
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

// Allowed file extensions (whitelist)
const ALLOWED_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(request, ["admin"]);

  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const resolvedParams = await params;
    const clubId = resolvedParams.id;

    // Check if club exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: jpg, png, webp" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size: 5MB" },
        { status: 400 }
      );
    }

    // Generate unique key for the file using validated extension from MIME type
    const extension = ALLOWED_EXTENSIONS[file.type] || "jpg";
    const imageKey = `clubs/${clubId}/${randomUUID()}.${extension}`;

    // In production, this would upload to Supabase/S3/Cloudinary
    // For now, we return a mock URL (development mode)
    const imageUrl = `/uploads/${imageKey}`;

    // Get current max sortOrder for this club's gallery
    const maxSortOrder = await prisma.clubGallery.aggregate({
      where: { clubId },
      _max: { sortOrder: true },
    });

    const sortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

    // Create gallery record
    const galleryImage = await prisma.clubGallery.create({
      data: {
        clubId,
        imageUrl,
        imageKey,
        altText: file.name,
        sortOrder,
      },
    });

    return NextResponse.json(
      {
        id: galleryImage.id,
        url: imageUrl,
        key: imageKey,
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
        sortOrder: galleryImage.sortOrder,
      },
      { status: 201 }
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error uploading club image:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
