import { NextResponse } from "next/server";

/**
 * PATCH /api/admin/clubs/[id]/metadata
 * 
 * Note: According to project rules (copilot-settings.md #7),
 * metadata field must NEVER be exposed or requested via API endpoints.
 * This endpoint exists only for backward compatibility with tests
 * and will always return an error.
 */
export async function PATCH() {
  return NextResponse.json(
    { error: "Metadata endpoint is not available. Metadata is internal-only and must not be exposed." },
    { status: 501 }
  );
}
