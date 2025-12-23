import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { getMimeTypeFromFilename, STORAGE_DIR } from "@/lib/imageUpload";

/**
 * GET /api/images/[filename]
 * Serves uploaded images from the filesystem
 * 
 * Returns the image file with appropriate Content-Type and Cache-Control headers
 * Returns 404 if the file does not exist
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Validate filename to prevent directory traversal
    if (!filename || filename.includes("..") || filename.includes("/")) {
      return NextResponse.json(
        { error: "Invalid filename" },
        { status: 400 }
      );
    }

    // Construct file path
    const filePath = join(STORAGE_DIR, filename);

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    // Read the file
    const fileBuffer = await readFile(filePath);

    // Determine MIME type
    const mimeType = getMimeTypeFromFilename(filename);

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error serving image:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
