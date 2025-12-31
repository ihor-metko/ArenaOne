import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrganizationAdmin } from "@/lib/requireRole";

/**
 * GET /api/admin/organizations/[id]/summary
 * Returns lightweight organization summary for layout usage (sidebar, header, breadcrumbs)
 * Only includes: id, name, slug
 * Does NOT include: admins, owners, permissions, settings, branding, metadata, metrics
 * Allowed: isRoot OR ORGANIZATION_ADMIN of this org
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authResult = await requireOrganizationAdmin(id);
    if (!authResult.authorized) {
      return authResult.response;
    }

    // Fetch only minimal organization data
    const organization = await prisma.organization.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching organization summary:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
