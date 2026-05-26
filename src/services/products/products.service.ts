import fs from "fs";
import { CachedProduct } from "../types";
import { PRODUCTS_CACHE_PATH } from "../constants";
import { callAIForProduct } from "../ai/productAI";
import { generateId } from "./products/productId";
//
// let products = new Map<string, ProductForCatalog>();
// let secondaryProducts = new Map<string, ProductForCatalog>();
//
// export function loadProducts() {
// 	if (!fs.existsSync(PRODUCTS_PATH)) return;
//
// 	const raw = fs.readFileSync(PRODUCTS_PATH, "utf8");
// 	const list: ProductForCatalog[] = sortProducts(JSON.parse(raw));
//
// 	products.clear();
//
// 	for (const product of list) {
// 		products.set(product.id, product);
// 	}
// }
//
//
// export function saveProducts(list: ProductForCatalog[]) {
//   const sorted = sortProducts(list);
//
//   fs.writeFileSync(
//     PRODUCTS_PATH,
//     JSON.stringify(sorted, null, 2),
//     "utf-8"
//   );
//
//   products.clear();
//   for (const product of sorted) {
//     products.set(product.id, product);
//   }
//
//   // 🔥 добавь это
//   rebuildCatalog();
// }
//
// function buildProducts(
//   role: UserRole | undefined,
//   filters: ProductFilters = {},
// ): ProductForCatalog[] {
//   const rates = getRates();
//   const priceFormation = getPriceFormation();
//
//   return Array.from(products.values())
//     .filter(p => {
//       if (filters.brand && p.brand !== filters.brand) return false;
//       if (filters.category && p.category !== filters.category) return false;
//       if (filters.model && p.model !== filters.model) return false;
//
//       if (filters.storage) {
//         if (!p.storage) return false;
//         if (p.storage !== filters.storage) return false;
//       }
//
//       return true;
//     })
//     .map(product => ({
//       ...product,
//       price: priceFormat(
//         product.price,
//         rates,
//         priceFormation,
//         product.category,
//         product.brand,
//         product.secondaryPrice,
//         role
//       ),
//     }));
// }
//
// export function getProducts(
// 	chatId: number,
// 	filters: ProductFilters = {},
// ): ProductForCatalog[] {
// 	const userRole = getUser(chatId)?.role;
//
//   return buildProducts(userRole, filters);
// }
//
// export function getRetailProducts(
//   filters: ProductFilters = {},
// ): ProductForCatalog[] {
//   const retailRole = 'retail';
//
//   return buildProducts(retailRole, filters);
// }
//
// export function getProductById(chatId: number, id?: string): Product | undefined {
//   const userRole = getUser(chatId)?.role;
//   const rates = getRates();
//   const priceFormation = getPriceFormation();
//
//   if (!id) return undefined;
//   const product = products.get(id);
//   if (!product) return undefined;
//
// 	return {
//     ...product,
//     price: priceFormat(
//       product.price,
//       rates,
//       priceFormation,
//       product.category,
//       product.brand,
//       product.secondaryPrice,
//       userRole
//     ),
//   };
// }
//
// export function refreshProductsMarkup() {
//   const list = Array.from(products.values());
//
//   const updated = addProductMarkup(list);
//
//   products.clear();
//
//   for (const product of updated) {
//     products.set(product.id, product);
//   }
//
//   return updated;
// }
//
// export function loadSecondaryProducts() {
//   if (!fs.existsSync(SECONDARY_PRODUCTS_PATH)) return;
//
//   const raw = fs.readFileSync(SECONDARY_PRODUCTS_PATH, "utf8");
//   const list: ProductForCatalog[] = JSON.parse(raw);
//
//   secondaryProducts.clear();
//
//   for (const product of list) {
//     secondaryProducts.set(product.id, product);
//   }
// }
//
// export function saveSecondaryProducts(list: ProductForCatalog[]) {
//   fs.writeFileSync(
//     SECONDARY_PRODUCTS_PATH,
//     JSON.stringify(list, null, 2),
//     "utf-8"
//   );
//
//   secondaryProducts.clear();
//
//   for (const product of list) {
//     secondaryProducts.set(product.id, product);
//   }
//
//   rebuildCatalog();
// }
//
// function getKey(p: ProductForCatalog) {
//   return `${p.brand}|${p.category}|${p.model}|${p.storage || ""}`;
// }
//
// export function rebuildCatalog() {
//   const mainList = Array.from(products.values());
//   const secondaryList = Array.from(secondaryProducts.values());
//
//   const map = new Map<string, ProductForCatalog>();
//
//   // 1. кладём main
//   for (const p of mainList) {
//     map.set(getKey(p), { ...p, secondaryPrice: false });
//   }
//
//   // 2. применяем secondary
//   for (const sp of secondaryList) {
//     if (!sp.model || sp.model === "UNKNOWN") continue;
//
//     const key = getKey(sp);
//     const existing = map.get(key);
//
//     // если нет в main → добавляем
//     if (!existing) {
//       map.set(key, {
//         ...sp,
//         id: `sec_${sp.id}`,
//         secondaryPrice: true,
//       });
//       continue;
//     }
//
//     // если дешевле → обновляем цену
//     const rates = getRates();
//     const mainUsd = Number(existing.price) / rates.rub_to_usd;
//     const secondaryUsd = Number(sp.price);
//
//     if (secondaryUsd < mainUsd) {
//       map.set(key, {
//         ...existing,
//         price: sp.price,
//         secondaryPrice: true,
//       });
//     }
//   }
//
//   // обновляем основной Map
//   products.clear();
//
//   for (const p of map.values()) {
//     products.set(p.id, p);
//   }
// }

export let productCache = new Map<string, CachedProduct>();

export function setProductCache(items: CachedProduct[]) {
  productCache.clear();

  for (const item of items) {
    productCache.set(item.id, item);
  }
}

export function getProductCache() {
  return productCache;
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
  const list = Array.from(productCache.values());

  fs.writeFileSync(
    PRODUCTS_CACHE_PATH,
    JSON.stringify(list, null, 2),
    "utf-8"
  );
}

function normalize(str: string) {
  return str.toLowerCase().replace(/\s+/g, " ").trim();
}

export async function upsertProduct(
  rawName: string,
  ai: {
    status: string;
    brand: string;
    model: string;
    category: string;
    name: string;
    attributes?: {
      storage?: string;
      color?: string;
      country?: string;
      sim?: string;
    };
  },
  category: string,
): Promise<CachedProduct | null> {
  if (!ai || ai.status !== "ok") return null;

  const id = generateId({
    brand: ai.brand,
    model: ai.model,
    storage: ai.attributes?.storage,
    color: ai.attributes?.color,
  });

  const existing = productCache.get(id);

  // 🔄 UPDATE
  if (existing) {
    const normalizedRaw = normalize(rawName);

    const exists = existing.namesInPrices.some(
      n => normalize(n) === normalizedRaw
    );

    if (!exists) {
      existing.namesInPrices.push(rawName);
      saveProductCache();
    }

    return existing;
  }

  // ➕ CREATE
  const newProduct: CachedProduct = {
    id,
    brand: ai.brand,
    model: ai.model,
    category,
    name: ai.name,
    attributes: ai.attributes,
    namesInPrices: [rawName],
  };

  productCache.set(id, newProduct);
  saveProductCache();

  return newProduct;
}

export function getCachedProductById(
  productId: string
): CachedProduct | undefined {
  return productCache.get(productId);
}

