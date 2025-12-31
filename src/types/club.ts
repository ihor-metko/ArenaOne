import { SportType } from "@/constants/sports";
import type { EntityLogoMetadata } from "@/components/ui/EntityLogo";

/**
 * Logo data structure
 */
export interface LogoData {
  url: string;
  altText?: string;
  thumbnailUrl?: string;
}

/**
 * Banner data structure
 */
export interface BannerData {
  url: string;
  altText?: string;
  description?: string;
  position?: 'top' | 'center' | 'bottom';
}

export interface Club {
  id: string;
  name: string;
  slug?: string | null;
  location: string;
  contactInfo: string | null;
  openingHours: string | null;
  logoData?: LogoData | null;
  status: string;
  supportedSports?: SportType[];
  createdAt: string;
}

/** Organization reference info for clubs */
export interface ClubOrganizationInfo {
  id: string;
  name: string;
  slug: string;
}

/** Club admin reference info */
export interface ClubAdminInfo {
  id: string;
  name: string | null;
  email: string;
}

/** Extended club info with court counts for card display */
export interface ClubWithCounts extends Club {
  organizationId: string;
  shortDescription?: string | null;
  city?: string | null;
  bannerData?: BannerData | null;
  metadata?: string | null;
  tags?: string | null;
  isPublic?: boolean;
  status: string;
  supportedSports?: SportType[];
  indoorCount?: number;
  outdoorCount?: number;
  courtCount?: number;
  bookingCount?: number;
  organization?: ClubOrganizationInfo | null;
  admins?: ClubAdminInfo[];
}

export interface ClubFormData {
  name: string;
  location: string;
  contactInfo: string;
  openingHours: string;
  logo: string;
}

export interface ClubBusinessHours {
  id: string;
  clubId: string;
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClubSpecialHours {
  id: string;
  clubId: string;
  date: string;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClubGalleryImage {
  id: string;
  clubId: string;
  imageUrl: string;
  imageKey: string | null;
  altText: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface ClubCourt {
  id: string;
  clubId: string;
  name: string;
  slug: string | null;
  type: string | null;
  surface: string | null;
  indoor: boolean;
  sportType?: SportType;
  defaultPriceCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClubCoachUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export interface ClubCoach {
  id: string;
  userId: string;
  clubId: string | null;
  bio: string | null;
  phone: string | null;
  createdAt: string;
  user: ClubCoachUser;
}

export interface ClubDetail {
  id: string;
  organizationId: string;
  organization?: ClubOrganizationInfo;
  name: string;
  slug: string | null;
  organizationId: string;
  shortDescription: string | null;
  longDescription: string | null;
  location: string;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  socialLinks: string | null;
  contactInfo: string | null;
  openingHours: string | null;
  logoData?: LogoData | null;
  bannerData?: BannerData | null;
  metadata: string | null;
  defaultCurrency: string | null;
  timezone: string | null;
  isPublic: boolean;
  status: string;
  tags: string | null;
  /**
   * Flexible metadata field for storing additional club configuration.
   * Common uses include:
   * - bannerAlignment: 'top' | 'center' | 'bottom' (controls hero image positioning)
   * - logoTheme: 'light' | 'dark' (for theme-aware logo display)
   * - secondLogo: string | null (alternate logo URL)
   * - secondLogoTheme: 'light' | 'dark'
   * - Any other custom club-specific settings
   */
  supportedSports?: SportType[];
  createdAt: string;
  updatedAt: string;
  courts: ClubCourt[];
  coaches: ClubCoach[];
  gallery: ClubGalleryImage[];
  businessHours: ClubBusinessHours[];
  specialHours: ClubSpecialHours[];
}

/**
 * Payload for creating a new club
 */
export interface CreateClubPayload {
  organizationId: string;
  name: string;
  slug?: string;
  shortDescription: string;
  longDescription?: string;
  location: string;
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  socialLinks?: string | null;
  defaultCurrency?: string;
  timezone?: string;
  isPublic?: boolean;
  tags?: string | null;
  supportedSports?: SportType[];
  logoData?: LogoData;
  bannerData?: BannerData;
  gallery?: Array<{
    url: string;
    key: string;
  }>;
  businessHours?: Array<{
    dayOfWeek: number;
    openTime: string | null;
    closeTime: string | null;
    isClosed: boolean;
  }>;
  courts?: Array<{
    name: string;
    type: string | null;
    surface: string | null;
    indoor: boolean;
    sportType?: SportType;
    defaultPriceCents: number;
  }>;
}

/**
 * Payload for updating a club
 */
export interface UpdateClubPayload {
  name?: string;
  location?: string;
  contactInfo?: string | null;
  openingHours?: string | null;
  logoData?: LogoData | null;
  bannerData?: BannerData | null;
  supportedSports?: SportType[];
}

/**
 * Club metadata type extending EntityLogoMetadata with banner alignment
 */
export interface ClubMetadata extends EntityLogoMetadata {
  /** Banner image vertical alignment */
  bannerAlignment?: 'top' | 'center' | 'bottom';
  /** Logo count: one or two logos */
  logoCount?: 'one' | 'two';
  /** Background color for logo preview/display */
  logoBackground?: 'light' | 'dark';
}

/**
 * Helper function to parse club metadata from JSON string or object
 * 
 * @param metadata - Can be a JSON string (from database) or already parsed object (from API)
 * @returns Parsed metadata or undefined if invalid
 */
export function parseClubMetadata(metadata: string | Record<string, unknown> | null | undefined): ClubMetadata | undefined {
  if (!metadata) {
    return undefined;
  }

  try {
    let parsed: Record<string, unknown>;
    
    // If metadata is already an object (from API response), validate and use it
    if (typeof metadata === 'object') {
      // Basic validation - ensure it's a plain object
      if (Object.prototype.toString.call(metadata) === '[object Object]') {
        parsed = metadata;
      } else {
        return undefined;
      }
    } else {
      // If metadata is a string (from database), parse it
      parsed = JSON.parse(metadata) as Record<string, unknown>;
    }
    
    // Note: Clubs never used nested logoMetadata structure, but we check for consistency
    // If a nested structure exists (unlikely), migrate it to flat format
    if (parsed.logoMetadata && typeof parsed.logoMetadata === 'object') {
      const logoMetadata = parsed.logoMetadata as Record<string, unknown>;
      
      // Migrate nested properties to top level if not already there
      if (logoMetadata.secondLogo && !parsed.secondLogo) {
        parsed.secondLogo = logoMetadata.secondLogo;
      }
      if (logoMetadata.logoTheme && !parsed.logoTheme) {
        parsed.logoTheme = logoMetadata.logoTheme;
      }
      if (logoMetadata.secondLogoTheme && !parsed.secondLogoTheme) {
        parsed.secondLogoTheme = logoMetadata.secondLogoTheme;
      }
      if (logoMetadata.logoCount && !parsed.logoCount) {
        parsed.logoCount = logoMetadata.logoCount;
      }
      if (logoMetadata.logoBackground && !parsed.logoBackground) {
        parsed.logoBackground = logoMetadata.logoBackground;
      }
    }
    
    return parsed as ClubMetadata;
  } catch {
    // Invalid JSON
    return undefined;
  }
}

/**
 * Helper function to parse logo data from JSON string
 * 
 * @param logoData - JSON string from database
 * @returns Parsed logo data or undefined if invalid
 */
export function parseLogoData(logoData: string | null | undefined): LogoData | undefined {
  if (!logoData) {
    return undefined;
  }

  try {
    return JSON.parse(logoData) as LogoData;
  } catch {
    return undefined;
  }
}

/**
 * Helper function to parse banner data from JSON string
 * 
 * @param bannerData - JSON string from database
 * @returns Parsed banner data or undefined if invalid
 */
export function parseBannerData(bannerData: string | null | undefined): BannerData | undefined {
  if (!bannerData) {
    return undefined;
  }

  try {
    return JSON.parse(bannerData) as BannerData;
  } catch {
    return undefined;
  }
}
