import { findPriceRule, normalizeOfferPrice, priceFormat, replaceStorageInName } from "../../utils";
import { getProductFromCacheById } from "../products/products.service";
import { getCatalog } from "./catalog.service";
import { ProductForUI, UserRole } from "../../types";
import { getPriceFormation, getRates } from "../price.service";

export function getCatalogProducts(options?: {
  role?: UserRole | "retail";
  includeOffers?: boolean;
}): ProductForUI[] {
  const role = options?.role;
  const isNoMarkupRole =
    !role ||
    role === "admin" ||
    role === "superadmin";
  const includeOffers = options?.includeOffers ?? false;

  const rates = getRates();
  const priceFormation = getPriceFormation();

  const result: ProductForUI[] = [];

  const catalogItems = getCatalog();

  for (const item of catalogItems) {
    const cached = getProductFromCacheById(item.productId);
    if (!cached) continue;
    if (!item.offers.length) continue;

    const minOffer = item.offers.reduce((min, o) =>
      normalizeOfferPrice(o, rates) < normalizeOfferPrice(min, rates) ? o : min
    );

    const basePrice = minOffer.price;
    const source = minOffer.source;
    let country = minOffer.country;
    if (cached.brand === 'Apple' && cached.category === 'Смартфоны') {
      country = undefined;
    }

    const price = isNoMarkupRole
      ? basePrice
      : priceFormat(
        basePrice,
        rates,
        priceFormation,
        cached.category,
        cached.brand,
        source,
        role
      );

    const hidden =
      !findPriceRule(Number(basePrice), cached.category, cached.brand, "wholesale", priceFormation) &&
      !findPriceRule(Number(basePrice), cached.category, cached.brand, "retail", priceFormation);

    result.push({
      id: cached.id,
      category: cached.category,
      name: replaceStorageInName(cached.name),
      brand: cached.brand,
      model: cached.model,

      storage: cached.attributes?.storage,
      country,
      sim: cached.attributes?.sim,
      activated: cached.attributes?.activated,

      price,
      source,
      hidden,

      ...(includeOffers && { offers: item.offers }),
    });
  }

  return result;
}
