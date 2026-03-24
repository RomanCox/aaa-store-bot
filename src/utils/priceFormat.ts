import { Rates, PriceFormat, UserRole } from "../types";

export function findPriceRule(
  priceUSD: number,
  category: string | undefined,
  brand: string | undefined,
  type: UserRole,
  formats: PriceFormat[]
) {
  let normalizedBrand = brand;

  if (category === "Смартфоны" && brand !== "Apple") {
    normalizedBrand = "Android";
  }

  const candidates = formats.filter((f) => {
    if (f.category && f.category !== category) return false;
    return !(f.brand && f.brand !== normalizedBrand);
  });

  for (const format of candidates) {
    const rules = format.prices
      .filter((p) => p.type === type)
      .sort((a, b) => (a.max ?? Infinity) - (b.max ?? Infinity));

    for (const rule of rules) {
      if (!rule.max || priceUSD <= rule.max) {
        return rule.percent;
      }
    }
  }

  return 0;
}

export function priceFormat(
  price: string,
  rates: Rates,
  priceFormation: PriceFormat[],
  category?: string,
  brand?: string,
  clientType?: UserRole
) {
	const numberPrice = Number(price);

	if (Number.isNaN(numberPrice)) {
		return price;
	}

  if (!clientType) return price;

  const priceUSD = numberPrice / rates.rub_to_usd;

  const percent = findPriceRule(
    priceUSD,
    category,
    brand,
    clientType,
    priceFormation
  );

  // WHOLESALE
  if (clientType === "wholesale") {
    const resultUSD = priceUSD * (1 + percent / 100);

    return String(Math.round(resultUSD));
  }

  // RETAIL
  if (clientType === "retail") {
    const priceBYN = (numberPrice / 100) * rates.rub_to_byn;

    const resultBYN = priceBYN * (1 + percent / 100);

    return String(Math.round(resultBYN / 10) * 10);
  }

  return price;
}