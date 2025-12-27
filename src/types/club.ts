import { SportType } from "@/constants/sports";

/**
 * Logo object structure
 */
export interface LogoObject {
  url: string;
  altText?: string;
  thumbnailUrl?: string;
  theme?: 'light' | 'dark';
  secondUrl?: string;
  secondTheme?: 'light' | 'dark';
}

/**
 * Banner object structure
 */
export interface BannerObject {
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
  logo: LogoObject | null;
  status: string;
  supportedSports?: SportType[];
  createdAt: string;
}

/** Organization reference info for clubs */
export interface ClubOrganizationInfo {
  id: string;
  name: string;
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
  banner?: BannerObject | null;
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
  logo: LogoObject | null;
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
  name: string;
  slug: string | null;
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
  logo: LogoObject | null;
  banner: BannerObject | null;
  metadata: string | null;
  defaultCurrency: string | null;
  timezone: string | null;
  isPublic: boolean;
  status: string;
  tags: string | null;
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
  banner?: BannerObject;
  logo?: LogoObject;
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
  logo?: LogoObject | null;
  banner?: BannerObject | null;
  supportedSports?: SportType[];
}

/**
 * Helper function to parse club logo from JSON string or object
 */
export function parseClubLogo(logo: string | LogoObject | null | undefined): LogoObject | undefined {
  if (!logo) {
    return undefined;
  }

  try {
    // If logo is already an object, return it
    if (typeof logo === 'object') {
      return logo as LogoObject;
    }
    
    // If logo is a string, try to parse it as JSON
    // First check if it looks like a URL (backward compatibility)
    if (typeof logo === 'string' && (logo.startsWith('http') || logo.startsWith('/'))) {
      // Old format - just a URL string
      return { url: logo };
    }
    
    // Otherwise, parse as JSON
    return JSON.parse(logo) as LogoObject;
  } catch {
    // If parsing fails, treat as a URL
    if (typeof logo === 'string') {
      return { url: logo };
    }
    return undefined;
  }
}

/**
 * Helper function to parse club banner from JSON string or object
 */
export function parseClubBanner(banner: string | BannerObject | null | undefined): BannerObject | undefined {
  if (!banner) {
    return undefined;
  }

  try {
    // If banner is already an object, return it
    if (typeof banner === 'object') {
      return banner as BannerObject;
    }
    
    // If banner is a string, try to parse it as JSON
    // First check if it looks like a URL (backward compatibility)
    if (typeof banner === 'string' && (banner.startsWith('http') || banner.startsWith('/'))) {
      // Old format - just a URL string
      return { url: banner };
    }
    
    // Otherwise, parse as JSON
    return JSON.parse(banner) as BannerObject;
  } catch {
    // If parsing fails, treat as a URL
    if (typeof banner === 'string') {
      return { url: banner };
    }
    return undefined;
  }
}
