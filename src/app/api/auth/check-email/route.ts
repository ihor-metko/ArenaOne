/**
 * GET /api/auth/check-email - Check if user exists by email
 * 
 * Public endpoint to check if a user account exists for a given email.
 * Used during invite acceptance flow to determine if user should sign in or sign up.
 * 
 * Security: This endpoint only returns a boolean, not user details.
 * Email enumeration is acceptable here as it's needed for the invite flow.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    // Normalize email to lowercase for consistent checking
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true }, // Only select id to minimize data exposure
    });

    return NextResponse.json({
      exists: !!user,
    });
  } catch (error) {
    console.error("Error checking email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
