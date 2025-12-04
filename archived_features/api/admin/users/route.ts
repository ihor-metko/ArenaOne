import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireRole";

/**
 * @deprecated This API is archived and will be removed. 
 * User roles are now context-specific via Membership and ClubMembership tables.
 * Use isRoot on User model to identify root admins.
 */

interface UserWhereClause {
  OR?: { name?: { contains: string; mode: "insensitive" }; email?: { contains: string; mode: "insensitive" } }[];
  isRoot?: boolean;
}

export async function GET(request: Request) {
  const authResult = await requireRole(request, ["super_admin"]);

  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";

    const whereClause: UserWhereClause = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Map old role filter to new isRoot filter for backward compatibility
    if (role === "super_admin" || role === "root_admin") {
      whereClause.isRoot = true;
    } else if (role === "player" || role === "coach") {
      whereClause.isRoot = false;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        isRoot: true,
        createdAt: true,
      },
    });

    // Transform response to include legacy role field for backward compatibility
    const usersWithRole = users.map(user => ({
      ...user,
      role: user.isRoot ? "root_admin" : "player",
    }));

    return NextResponse.json(usersWithRole);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching users:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authResult = await requireRole(request, ["super_admin"]);

  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await hash(password, 12);

    // Create the user (not a root admin by default)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isRoot: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isRoot: true,
        createdAt: true,
      },
    });

    // Add legacy role field for backward compatibility
    const userWithRole = {
      ...user,
      role: "player",
    };

    return NextResponse.json(userWithRole, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error creating user:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
