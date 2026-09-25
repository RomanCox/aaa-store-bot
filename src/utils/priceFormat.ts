import { Rates, PriceFormat, UserRole, PriceListType } from "../types";

export function findPriceRule(
  priceUSD: number,
  category: string | undefined,
  brand: string | undefined,
  type: UserRole,
  formats: PriceFormat[],
  name?: string
) {
  let normalizedBrand = brand;

  if (category === "Смартфоны" && brand !== "Apple") {
    normalizedBrand = "Android";
  }

  const normalizedName = name?.toLowerCase() ?? "";

  const candidates = formats.filter((f) => {
    if (f.category && f.category !== category) return false;
    if (f.brand && f.brand !== normalizedBrand) return false;
    // Группа с ключевыми словами (например, "iphone 18") подходит только
    // товарам, у которых хотя бы одно слово встречается в названии.
    if (f.keywords?.length) {
      return f.keywords.some((keyword) => normalizedName.includes(keyword.toLowerCase()));
    }
    return true;
  });

  // Группы с ключевыми словами всегда приоритетнее общих правил
  // категория+бренд — независимо от порядка строк в таблице. Сортировка
  // стабильна (ES2019+), поэтому между собой такие группы не перемешиваются.
  candidates.sort((a, b) => (b.keywords?.length ? 1 : 0) - (a.keywords?.length ? 1 : 0));

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

// AAA-store отдаёт цены в рублях, "Today there tomorrow here" — уже в USD.
// Диапазоны в price_formation.json заданы в USD, поэтому перед сравнением
// с ними цену нужно приводить сюда же — и здесь, и в findPriceRule.
export function toUsdPrice(
  numberPrice: number,
  rates: Rates,
  source?: PriceListType
) {
  return source === "Today there tomorrow here"
    ? numberPrice
    : numberPrice / rates.rub_to_usd;
}

export function priceFormat(
  price: string,
  rates: Rates,
  priceFormation: PriceFormat[],
  category?: string,
  brand?: string,
  source?: PriceListType,
  clientType?: UserRole,
  name?: string
) {
	const numberPrice = Number(price);

	if (Number.isNaN(numberPrice)) {
		return price;
	}

  if (!clientType) return price;

  const priceUSD = toUsdPrice(numberPrice, rates, source);

  const value = findPriceRule(
    priceUSD,
    category,
    brand,
    clientType,
    priceFormation,
    name
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