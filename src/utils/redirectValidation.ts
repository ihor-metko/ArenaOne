/**
 * Validates a redirect URL to prevent open redirect vulnerabilities.
 * Only allows relative paths that start with '/'.
 * 
 * @param url - The URL to validate
 * @returns The validated URL if safe, or null if the URL is invalid/unsafe
 */
export function validateRedirectUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  // Trim whitespace
  const trimmedUrl = url.trim();

  // Must start with a forward slash (relative path)
  if (!trimmedUrl.startsWith("/")) {
    return null;
  }

  // Must not have a protocol (to prevent javascript: or data: URLs)
  // These patterns would make the URL absolute
  if (trimmedUrl.startsWith("//")) {
    return null;
  }

  // Block URLs that could be interpreted as absolute URLs
  // e.g., /\evil.com could be normalized to //evil.com
  if (/^\/[\\]+/.test(trimmedUrl)) {
    return null;
  }

  // Decode the URL and check again for protocol injection
  try {
    const decoded = decodeURIComponent(trimmedUrl);
    
    // After decoding, re-verify it's still a relative path
    if (!decoded.startsWith("/") || decoded.startsWith("//") || /^\/[\\]+/.test(decoded)) {
      return null;
    }

    // Check for any scheme-like patterns that could be abused
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(decoded)) {
      return null;
    }
  } catch {
    // If URL can't be decoded, reject it
    return null;
  }

  return trimmedUrl;
}
