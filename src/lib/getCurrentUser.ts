import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

/**
 * Success result type for getCurrentUser.
 */
export interface GetCurrentUserSuccess {
  authorized: true;
  user: User;
}

/**
 * Failure result type for getCurrentUser.
 */
export interface GetCurrentUserFailure {
  authorized: false;
  response: NextResponse;
}

/**
 * Result type for getCurrentUser.
 */
export type GetCurrentUserResult = GetCurrentUserSuccess | GetCurrentUserFailure;

/**
 * Get the current authenticated user from the database.
 * 
 * This function provides a centralized way to:
 * 1. Verify the user is authenticated via session
 * 2. Ensure the user exists in the database
 * 3. Create the user if they don't exist (idempotent behavior)
 * 4. Return the complete database User entity
 * 
 * This is the **single source of truth** for the current user in API routes.
 * Use this instead of:
 * - Reading userId from request body
 * - Using session.user.id directly for database operations
 * - Assuming the session user exists in the database
 * 
 * @returns Promise resolving to authorized status with full User entity or error response
 * 
 * @example
 * const userResult = await getCurrentUser();
 * if (!userResult.authorized) return userResult.response;
 * 
 * const { user } = userResult;
 * // Use user.id for database operations
 * await prisma.booking.create({
 *   data: {
 *     userId: user.id,
 *     // ...
 *   }
 * });
 */
export async function getCurrentUser(): Promise<GetCurrentUserResult> {
  // 1. Get the session
  const session = await auth();

  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const sessionUserId = session.user.id;
  const sessionUserEmail = session.user.email;

  // 2. Look up the user in the database
  let user = await prisma.user.findUnique({
    where: { id: sessionUserId },
  });

  // 3. If user doesn't exist, create them (idempotent behavior)
  // This handles the case where the session exists but the user was deleted
  // or when using OAuth providers where the user may not exist yet
  if (!user) {
    // For user creation, we need at least an email
    if (!sessionUserEmail) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "User email is required" },
          { status: 400 }
        ),
      };
    }

    // Check if a user with this email already exists
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: sessionUserEmail },
    });

    if (existingUserByEmail) {
      // User exists with this email but different ID
      // This shouldn't happen in normal flow, but we'll use the existing user
      user = existingUserByEmail;
    } else {
      // Create new user with data from session
      user = await prisma.user.create({
        data: {
          id: sessionUserId,
          email: sessionUserEmail,
          name: session.user.name ?? null,
          image: session.user.image ?? null,
          isRoot: session.user.isRoot ?? false,
        },
      });
    }
  }

  // 4. Return the database user
  return {
    authorized: true,
    user,
  };
}
