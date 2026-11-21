import {
  findPriceRule,
  priceFormat,
  replaceStorageInName,
  toUsdPrice,
  canSeeWarehouse
} from "../../utils";
import { getProductFromCacheById } from "../products/products.service";
import { findBestCatalogOffer, getCatalog } from "./catalog.service";
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
    const marketOffer = findBestCatalogOffer(item.offers, rates, false);
    const selected = marketOffer ?? findBestCatalogOffer(item.offers, rates, true);
    if (!selected) continue;

    const lastPriceUsd = item.lastMarketPrice?.priceUsd;
    const basePrice = !marketOffer && lastPriceUsd !== undefined &&
      Number.isFinite(lastPriceUsd) && lastPriceUsd > 0
      ? String(lastPriceUsd)
      : selected.offer.price;
    const source = selected.offer.source;
    let country = selected.offer.country;
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
