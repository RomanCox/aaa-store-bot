"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductCache = getProductCache;
exports.getProductFromCacheById = getProductFromCacheById;
exports.setProductToCache = setProductToCache;
exports.getProductCacheValues = getProductCacheValues;
exports.loadProductCache = loadProductCache;
exports.saveProductCache = saveProductCache;
exports.findByRawName = findByRawName;
exports.matchProduct = matchProduct;
const fs_1 = __importDefault(require("fs"));
const constants_1 = require("../../constants");
const product_builder_1 = require("./product.builder");
let productCache = new Map();
function getProductCache() {
    return productCache;
}
function getProductFromCacheById(productId) {
    return productCache.get(productId) ?? null;
}
function setProductToCache(id, newProduct) {
    productCache.set(id, newProduct);
}
function getProductCacheValues() {
    return Array.from(productCache.values());
}
function loadProductCache() {
    if (!fs_1.default.existsSync(constants_1.PRODUCTS_CACHE_PATH))
        return;
    const raw = fs_1.default.readFileSync(constants_1.PRODUCTS_CACHE_PATH, "utf8");
    const list = JSON.parse(raw);
    productCache.clear();
    for (const p of list) {
        productCache.set(p.id, p);
    }
}
function saveProductCache() {
    let existing = [];
    try {
        existing = JSON.parse(fs_1.default.readFileSync(constants_1.PRODUCTS_CACHE_PATH, "utf-8"));
    }
    catch {
        existing = [];
    }
    const map = new Map();
    for (const item of existing) {
        map.set(item.id, item);
    }
    for (const item of productCache.values()) {
        map.set(item.id, item);
    }
    fs_1.default.writeFileSync(constants_1.PRODUCTS_CACHE_PATH, JSON.stringify([...map.values()], null, 2), "utf-8");
}
function findByRawName(raw) {
    for (const product of productCache.values()) {
        if (product.rawNames.some(n => (0, product_builder_1.normalize)(n) === (0, product_builder_1.normalize)(raw))) {
            return product;
        }
    }
    return undefined;
}
function matchProduct(input) {
    // 1. FAST PATH — RAW NAME MATCH
    const productByRaw = findByRawName(input.rawName);
    if (productByRaw) {
        return {
            product: productByRaw,
            matchType: "raw",
        };
    }
    // 2. STRUCTURAL MATCH (no AI)
    for (const product of productCache.values()) {
        const attrs = product.attributes || {};
        if (product.brand !== input.brand)
            continue;
        if (product.model !== input.model)
            continue;
        if (input.storage && attrs.storage !== input.storage)
            continue;
        if (input.color && (0, product_builder_1.normalize)(attrs.color ?? "") !== (0, product_builder_1.normalize)(input.color))
            continue;
        if (input.sim && attrs.sim !== input.sim)
            continue;
        if (input.activated !== undefined && attrs.activated !== input.activated)
            continue;
        if (input.connectivity !== undefined && attrs.connectivity !== input.connectivity)
            continue;
        if (input.chip !== undefined && attrs.chip !== input.chip)
            continue;
        return { product, matchType: "structural" };
    }
    // 3. NO MATCH → NEW PRODUCT
    return null;
}
