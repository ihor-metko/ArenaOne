import { calculatePriceRange, formatPriceRange } from "@/utils/price";

describe("calculatePriceRange", () => {
  it("should return null for empty array", () => {
    expect(calculatePriceRange([])).toBeNull();
  });

  it("should return null for undefined input", () => {
    expect(calculatePriceRange(undefined as any)).toBeNull();
  });

  it("should return same min and max for single court", () => {
    const courts = [{ defaultPriceCents: 5000 }];
    const result = calculatePriceRange(courts);
    
    expect(result).not.toBeNull();
    expect(result?.minPrice).toBe(5000);
    expect(result?.maxPrice).toBe(5000);
  });

  it("should calculate correct range for multiple courts", () => {
    const courts = [
      { defaultPriceCents: 5000 },
      { defaultPriceCents: 3000 },
      { defaultPriceCents: 7000 },
      { defaultPriceCents: 4500 },
    ];
    const result = calculatePriceRange(courts);
    
    expect(result).not.toBeNull();
    expect(result?.minPrice).toBe(3000);
    expect(result?.maxPrice).toBe(7000);
  });

  it("should handle all courts with same price", () => {
    const courts = [
      { defaultPriceCents: 5000 },
      { defaultPriceCents: 5000 },
      { defaultPriceCents: 5000 },
    ];
    const result = calculatePriceRange(courts);
    
    expect(result).not.toBeNull();
    expect(result?.minPrice).toBe(5000);
    expect(result?.maxPrice).toBe(5000);
  });

  it("should handle zero prices", () => {
    const courts = [
      { defaultPriceCents: 0 },
      { defaultPriceCents: 5000 },
    ];
    const result = calculatePriceRange(courts);
    
    expect(result).not.toBeNull();
    expect(result?.minPrice).toBe(0);
    expect(result?.maxPrice).toBe(5000);
  });
});

describe("formatPriceRange", () => {
  it("should format single price when min and max are the same", () => {
    expect(formatPriceRange(5000, 5000)).toBe("$50.00");
  });

  it("should format price range when min and max differ", () => {
    expect(formatPriceRange(3000, 7000)).toBe("$30.00 - $70.00");
  });

  it("should handle zero prices", () => {
    expect(formatPriceRange(0, 5000)).toBe("$0.00 - $50.00");
  });

  it("should format large prices correctly", () => {
    expect(formatPriceRange(10000, 15000)).toBe("$100.00 - $150.00");
  });

  it("should format cents correctly", () => {
    expect(formatPriceRange(4550, 6750)).toBe("$45.50 - $67.50");
  });
});
