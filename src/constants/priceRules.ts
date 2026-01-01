/**
 * Valid price rule types
 */
export const VALID_PRICE_RULE_TYPES = [
  "SPECIFIC_DAY",
  "SPECIFIC_DATE",
  "WEEKDAYS",
  "WEEKENDS",
  "ALL_DAYS",
  "HOLIDAY",
] as const;

export type PriceRuleType = typeof VALID_PRICE_RULE_TYPES[number];
