import {
  findPriceRule,
  normalizeOfferPrice,
  priceFormat,
  replaceStorageInName,
  toUsdPrice,
  canSeeWarehouse
} from "../../utils";
import { getProductFromCacheById } from "../products/products.service";
import { getCatalog } from "./catalog.service";
import { ProductForUI, UserRole } from "../../types";
import { getPriceFormation, getRates } from "../price.service";
import { getNamedIphoneDeviceModel } from "../products/iphone.models";

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
    const namedModel = cached.brand === "Apple" ? getNamedIphoneDeviceModel(cached.name) : undefined;
    const category = namedModel ? "Смартфоны" : cached.category;
    const model = namedModel ?? cached.model;
    const priceListOffers = item.offers.filter(offer => {
      if (offer.source === "warehouse") return false;
      const price = Number(offer.price);
      const priceUSD = normalizeOfferPrice(offer, rates);
      return Number.isFinite(price) && price > 0 && Number.isFinite(priceUSD) && priceUSD > 0;
    });
    if (!priceListOffers.length) continue;

    const minOffer = priceListOffers.reduce((min, o) =>
      normalizeOfferPrice(o, rates) < normalizeOfferPrice(min, rates) ? o : min
    );

    const basePrice = minOffer.price;
    const source = minOffer.source;
    let country = minOffer.country;
    if (cached.brand === 'Apple' && category === 'Смартфоны') {
      country = undefined;
    }

    const price = isNoMarkupRole
      ? basePrice
      : priceFormat(
        basePrice,
        rates,
        priceFormation,
        category,
        cached.brand,
        source,
        role,
        cached.name
      );

    const basePriceUSD = toUsdPrice(Number(basePrice), rates, source);
    const hidden =
      !findPriceRule(basePriceUSD, category, cached.brand, "wholesale", priceFormation, cached.name) &&
      !findPriceRule(basePriceUSD, category, cached.brand, "retail", priceFormation, cached.name);

    result.push({
      id: cached.id,
      category,
      name: replaceStorageInName(cached.name),
      brand: cached.brand,
      model,

      storage: cached.attributes?.storage,
      country,
      sim: cached.attributes?.sim,
      activated: cached.attributes?.activated,

      price,
      source,
      hidden,

      ...(canSeeWarehouse(role) && { inWarehouse: item.offers.some(offer => offer.source === "warehouse") }),

      ...(includeOffers && { offers: item.offers }),
    });
  }

  return result;
}
