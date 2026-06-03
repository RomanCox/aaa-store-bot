"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCatalogProducts = getCatalogProducts;
const utils_1 = require("../../utils");
const products_service_1 = require("../products/products.service");
const catalog_service_1 = require("./catalog.service");
const price_service_1 = require("../price.service");
function getCatalogProducts(options) {
    const role = options?.role;
    const isNoMarkupRole = !role ||
        role === "admin" ||
        role === "superadmin";
    const includeOffers = options?.includeOffers ?? false;
    const rates = (0, price_service_1.getRates)();
    const priceFormation = (0, price_service_1.getPriceFormation)();
    const result = [];
    const catalogItems = (0, catalog_service_1.getCatalog)();
    for (const item of catalogItems) {
        const cached = (0, products_service_1.getProductFromCacheById)(item.productId);
        if (!cached)
            continue;
        if (!item.offers.length)
            continue;
        const minOffer = item.offers.reduce((min, o) => (0, utils_1.normalizeOfferPrice)(o, rates) < (0, utils_1.normalizeOfferPrice)(min, rates) ? o : min);
        const basePrice = minOffer.price;
        const source = minOffer.source;
        const price = isNoMarkupRole
            ? basePrice
            : (0, utils_1.priceFormat)(basePrice, rates, priceFormation, cached.category, cached.brand, source, role);
        const hidden = !(0, utils_1.findPriceRule)(Number(basePrice), cached.category, cached.brand, "wholesale", priceFormation) &&
            !(0, utils_1.findPriceRule)(Number(basePrice), cached.category, cached.brand, "retail", priceFormation);
        result.push({
            id: cached.id,
            category: cached.category,
            name: (0, utils_1.replaceStorageInName)(cached.name),
            brand: cached.brand,
            model: cached.model,
            storage: cached.attributes?.storage,
            country: cached.attributes?.country,
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
