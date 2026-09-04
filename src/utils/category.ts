import {
  CATEGORY_MAP,
  CATEGORY_REVERSE_MAP,
  REGION_SENSITIVE_CATEGORIES,
} from "../constants/category";

export type CategoryKey = keyof typeof CATEGORY_MAP;

export function normalizeCategory(input: string): CategoryKey {
  return CATEGORY_REVERSE_MAP[input] ?? "unknown";
}

export function getCategoryRu(key: CategoryKey): string {
  return CATEGORY_MAP[key] ?? CATEGORY_MAP.unknown;
}

// Пылесосы/фены/стайлеры/выпрямители/увлажнители — у них разные региональные версии
// (вилка) с разной ценой, поэтому id этих товаров должен учитывать регион.
export function isRegionSensitiveCategory(category: string): boolean {
  return REGION_SENSITIVE_CATEGORIES.has(category);
}