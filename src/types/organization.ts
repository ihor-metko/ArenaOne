/**
 * Organization types for admin UI
 */

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

/**
 * Organization entity
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt: string;
  updatedAt?: string;
  archivedAt?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  website?: string | null;
  address?: string | null;
  metadata?: Record<string, unknown> | null;
  isPublic: boolean;
  supportedSports?: SportType[];
  clubCount?: number;
  logo?: LogoObject | null;
  banner?: BannerObject | null;
  createdBy?: {
    id: string;
    name: string | null;
    email: string;
  };
  superAdmin?: {
    id: string;
    name: string | null;
    email: string;
    isPrimaryOwner?: boolean;
  } | null;
  superAdmins?: Array<{
    id: string;
    name: string | null;
    email: string;
    isPrimaryOwner: boolean;
  }>;
}

/**
 * Payload for creating a new organization
 */
export interface CreateOrganizationPayload {
  name: string;
  slug?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  address?: string;
  logo?: LogoObject;
  banner?: BannerObject;
  metadata?: Record<string, unknown>;
  supportedSports?: SportType[];
}

/**
 * Payload for updating an organization
 */
export interface UpdateOrganizationPayload {
  name?: string;
  slug?: string;
  description?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  website?: string | null;
  address?: string | null;
  logo?: LogoObject | null;
  banner?: BannerObject | null;
  metadata?: Record<string, unknown> | null;
  supportedSports?: SportType[];
  isPublic?: boolean;
}

/**
 * Helper function to parse organization logo from JSON string or object
 */
export function parseOrganizationLogo(logo: string | LogoObject | null | undefined): LogoObject | undefined {
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
 * Helper function to parse organization banner from JSON string or object
 */
export function parseOrganizationBanner(banner: string | BannerObject | null | undefined): BannerObject | undefined {
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
