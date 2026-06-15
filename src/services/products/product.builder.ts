import { CachedProduct, UpsertProductInput } from "../../types";
import { generateId } from "./productId";
import {  getProductFromCacheById, setProductToCache } from "./products.service";

export function normalize(str: string) {
  return str
  .toLowerCase()
  .replace(/\s+/g, " ")
  .replace(/[\u00A0\u202F\u2009\u200A\u200B\uFEFF]/g, ' ')
  .trim();
}

export function buildAAAStoreRawName(input: {
  name: string;
  // country?: string;
  sim?: string;
}) {
  let result = input.name.trim();

  if (input.sim) {
    result += ` (${input.sim})`;
  }

  // if (input.country) {
  //   result += ` ${input.country}`;
  // }

  return result;
}

export function buildTodayThereTomorrowHereRawName(input: {
  name: string;
  sim?: string;
  activated?: boolean;
}) {
  let result = input.name;

  // 1. удалить флаги стран
  result = result.replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, "").trim();
  // 2. удалить старые sim пометки (в скобках)
  result = result.replace(/\([^)]*sim[^)]*\)/gi, "").trim();
  // 3. удалить (Active) (в любом регистре) – добавим позже в нужном месте
  result = result.replace(/\(active\)/gi, "").trim();

  // 4. собрать суффиксы в каноническом порядке: сначала SIM, затем Active
  const suffixes: string[] = [];
  if (input.sim) suffixes.push(`(${input.sim})`);
  if (input.activated === true) suffixes.push("(Active)");

  if (suffixes.length) {
    result += " " + suffixes.join(" ");
  }
  return result.replace(/\s+/g, " ").trim();
}

export function addRawNameIfNeeded(product: CachedProduct, raw: string) {
  const normalized = normalize(raw);
  const exists = product.rawNames.some(
    n => normalize(n) === normalized
  );
  if (!exists) {
    product.rawNames.push(raw);
  }
}

export function upsertProduct(input: UpsertProductInput): CachedProduct {
  const {
    rawName,
    brand,
    category,
    model,
    name,
    attributes
  } = input;

  const id = generateId({
    brand,
    category,
    model,
    storage: attributes?.storage,
    color: attributes?.color,
    // country: attributes?.country,
    sim: attributes?.sim,
    activated: attributes?.activated,
  });

  const existing = getProductFromCacheById(id);

  // 🔄 UPDATE
  if (existing) {
    const normalizedRaw = normalize(rawName);

    const exists = existing.rawNames.some(
      n => normalize(n) === normalizedRaw
    );

    if (!exists) {
      existing.rawNames.push(rawName);
    }

    return existing;
  }

  // ➕ CREATE
  const newProduct: CachedProduct = {
    id,
    brand,
    model,
    category,
    name,
    attributes,
    rawNames: [rawName],
  };

  setProductToCache(id, newProduct);

  return newProduct;
}