import { Rates, PriceFormat, UserRole, PriceListType } from "../types";

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
        return rule.value;
      }
    }
  }

  return 0;
}

export function normalizeOfferPrice(
  offer: { price: string; source: PriceListType },
  rates: Rates
) {
  if (offer.source === "AAA-store") {
    return Number(offer.price) / rates.rub_to_usd;
  }

  return Number(offer.price);
}

export function priceFormat(
  price: string,
  rates: Rates,
  priceFormation: PriceFormat[],
  category?: string,
  brand?: string,
  source?: PriceListType,
  clientType?: UserRole
) {
	const numberPrice = Number(price);

	if (Number.isNaN(numberPrice)) {
		return price;
	}

  if (!clientType) return price;

  const priceUSD = source === "Today there tomorrow here"
    ? numberPrice
    : numberPrice / rates.rub_to_usd;

  const value = findPriceRule(
    priceUSD,
    category,
    brand,
    clientType,
    priceFormation
  );

  const valueInRub = value * rates.rub_to_usd;

  // WHOLESALE
  if (clientType === "wholesale") {
    const resultUSD = source === "Today there tomorrow here"
      ? (numberPrice + value)
      : (numberPrice + valueInRub) / rates.rub_to_usd;

    return String(Math.round(resultUSD));
  }

  // RETAIL
  if (clientType === "retail") {
    const resultBYN = source === "Today there tomorrow here"
      ? (numberPrice + value) * rates.usd_to_byn
      : (numberPrice + valueInRub) / 100 * rates.rub_to_byn;

    return String(Math.round(resultBYN / 10) * 10);
  }

  return price;
}