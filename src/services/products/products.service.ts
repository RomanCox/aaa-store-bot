import fs from "fs";
import { CachedProduct, MatchInput } from "../../types";
import { PRODUCTS_CACHE_PATH } from "../../constants";
import { normalize } from "./product.builder";

let productCache = new Map<string, CachedProduct>();

export function getProductCache() {
  return productCache;
}

export function getProductFromCacheById(productId: string) {
  return productCache.get(productId) ?? null;
}

export function setProductToCache(id: string, newProduct: CachedProduct) {
  productCache.set(id, newProduct);
}

export function getProductCacheValues() {
  return Array.from(productCache.values());
}

export function loadProductCache() {
  if (!fs.existsSync(PRODUCTS_CACHE_PATH)) return;

  const raw = fs.readFileSync(PRODUCTS_CACHE_PATH, "utf8");
  const list: CachedProduct[] = JSON.parse(raw);

  productCache.clear();

  for (const p of list) {
    productCache.set(p.id, p);
  }
}

export function saveProductCache() {
  let existing: CachedProduct[] = [];

  try {
    existing = JSON.parse(
      fs.readFileSync(PRODUCTS_CACHE_PATH, "utf-8")
    );
  } catch {
    existing = [];
  }

  const map = new Map<string, CachedProduct>();

  for (const item of existing) {
    map.set(item.id, item);
  }

  for (const item of productCache.values()) {
    map.set(item.id, item);
  }

  fs.writeFileSync(
    PRODUCTS_CACHE_PATH,
    JSON.stringify([...map.values()], null, 2),
    "utf-8"
  );
}


export function findByRawName(raw: string) {
  for (const product of productCache.values()) {
    if (
      product.rawNames.some(n => normalize(n) === normalize(raw))
    ) {
      return product;
    }
  }
  return undefined;
}

export function matchProduct(input: MatchInput) {
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

  if (product.brand !== input.brand) continue;
  if (product.model !== input.model) continue;
  if (input.storage && attrs.storage !== input.storage) continue;
  if (input.color && normalize(attrs.color ?? "") !== normalize(input.color)) continue;
  if (input.sim && attrs.sim !== input.sim) continue;
  if (input.activated !== undefined && attrs.activated !== input.activated) continue;
  if (input.connectivity !== undefined && attrs.connectivity !== input.connectivity) continue;
  if (input.chip !== undefined && attrs.chip !== input.chip) continue;

  return { product, matchType: "structural" };
}

  // 3. NO MATCH → NEW PRODUCT
  return null;
}