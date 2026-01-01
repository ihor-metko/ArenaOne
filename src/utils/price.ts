// Constants for price conversion
export const CENTS_PER_DOLLAR = 100;

/**
 * Format a price in cents to a user-friendly dollar string
 * @param priceInCents - The price in cents
 * @returns Formatted price string (e.g., "$50.00")
 */
export function formatPrice(priceInCents: number): string {
  return `$${(priceInCents / CENTS_PER_DOLLAR).toFixed(2)}`;
}

/**
 * Convert a dollar amount to cents
 * @param dollars - The price in dollars
 * @returns Price in cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * CENTS_PER_DOLLAR);
}

/**
 * Convert a cents amount to dollars
 * @param cents - The price in cents
 * @returns Price in dollars
 */
export function centsToDollars(cents: number): number {
  return cents / CENTS_PER_DOLLAR;
}

/**
 * Calculate price range from an array of courts
 * @param courts - Array of courts with defaultPriceCents
 * @returns Object with minPrice and maxPrice in cents, or null if no courts
 */
export function calculatePriceRange(
  courts: Array<{ defaultPriceCents: number }>
): { minPrice: number; maxPrice: number } | null {
  if (!courts || courts.length === 0) {
    return null;
  }

  const prices = courts.map((court) => court.defaultPriceCents);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return { minPrice, maxPrice };
}

/**
 * Format a price range as a user-friendly string
 * @param minPrice - Minimum price in cents
 * @param maxPrice - Maximum price in cents
 * @returns Formatted price range string (e.g., "$40.00 - $60.00" or "$50.00" if same)
 */
export function formatPriceRange(minPrice: number, maxPrice: number): string {
  if (minPrice === maxPrice) {
    return formatPrice(minPrice);
  }
  return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
}
