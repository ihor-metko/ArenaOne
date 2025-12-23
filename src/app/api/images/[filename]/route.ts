import { NextResponse } from "next/server";
import { readFileFromStorage, getMimeTypeFromFilename, isValidFilename, ALLOWED_ENTITIES, type EntityType } from "@/lib/fileStorage";

/**
 * GET /api/images/[filename]
 * Serve an image from the filesystem storage.
 * 
 * For backward compatibility, this endpoint:
 * 1. First tries to read from the root /app/storage/images/ directory
 * 2. If not found, tries each entity subdirectory (organizations, clubs, general, users)
 * 
 * New uploads should use the entity-specific endpoint: /api/images/[entity]/[filename]
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const resolvedParams = await params;
    const { filename } = resolvedParams;

    // Validate filename to prevent path traversal
    if (!isValidFilename(filename)) {
      return NextResponse.json(
        { error: "Invalid filename" },
        { status: 400 }
      );
    }

    // Try to read from root directory first (backward compatibility)
    let result = await readFileFromStorage(filename);

    // If not found in root, try entity subdirectories
    if ("error" in result) {
      for (const entity of ALLOWED_ENTITIES) {
        result = await readFileFromStorage(filename, entity as EntityType);
        if (!("error" in result)) {
          break; // Found the file
        }
      }
    }

    // If still not found, return 404
    if ("error" in result) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Determine MIME type from filename extension
    const mimeType = getMimeTypeFromFilename(filename);

    // Return the image with appropriate headers
    return new NextResponse(result.buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable", // Cache for 1 year
      },
    });
  } catch (error) {
    console.error("Error serving image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
