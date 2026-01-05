/**
 * Court type localization helper
 */

/**
 * Get localized label for court type
 * @param type - Court type string (e.g., "single", "double", "SINGLE", "DOUBLE")
 * @param t - Translation function from useTranslations
 * @returns Localized court type label
 */
export function getCourtTypeLabel(
  type: string | null,
  t: (key: string) => string
): string {
  if (!type) return "";
  
  const normalizedType = type.toLowerCase();
  if (normalizedType === "single") {
    return t("court.type.single");
  } else if (normalizedType === "double") {
    return t("court.type.double");
  }
  // Fallback to original type if no translation exists
  return type;
}
