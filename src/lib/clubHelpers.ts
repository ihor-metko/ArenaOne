import { prisma } from "@/lib/prisma";

/**
 * Helper function to fetch and format a club with all related data
 * Used to ensure consistent club object structure across all API endpoints
 * 
 * @param clubId - The ID of the club to fetch
 * @returns Formatted club object with parsed JSON fields, or null if not found
 */
export async function fetchFormattedClub(clubId: string) {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      courts: {
        orderBy: { name: "asc" },
      },
      coaches: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
      gallery: {
        orderBy: { sortOrder: "asc" },
      },
      businessHours: {
        orderBy: { dayOfWeek: "asc" },
      },
    },
  });

  if (!club) {
    return null;
  }

  // Parse JSON fields with error handling
  let logoData = null;
  let bannerData = null;

  if (club.logoData) {
    try {
      logoData = JSON.parse(club.logoData);
    } catch (error) {
      console.error(`Failed to parse logoData for club ${clubId}:`, error);
      // Leave logoData as null if parsing fails
    }
  }

  if (club.bannerData) {
    try {
      bannerData = JSON.parse(club.bannerData);
    } catch (error) {
      console.error(`Failed to parse bannerData for club ${clubId}:`, error);
      // Leave bannerData as null if parsing fails
    }
  }

  return {
    ...club,
    logoData,
    bannerData,
  };
}
