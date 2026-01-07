import { NextResponse } from "next/server";

/**
 * PATCH /api/admin/clubs/[id]/metadata
 * 
 * Note: According to project rules (copilot-settings.md #7),
 * metadata field must NEVER be exposed or requested via API endpoints.
 * This endpoint exists only for backward compatibility with tests
 * and will always return an error.
 * 
 * @param _request - The HTTP request (unused, endpoint always returns error)
 * @param _params - Route parameters (unused, endpoint always returns error)
 * @returns JSON error response with 501 Not Implemented status
 */
export async function PATCH(
  _request: Request,
  _params: { params: Promise<{ id: string }> }
) {
  // Intentionally unused parameters - this endpoint always rejects requests
  void _request;
  void _params;
  
  return NextResponse.json(
    { error: "Metadata endpoint is not available. Metadata is internal-only and must not be exposed." },
    { status: 501 }
  );
}
