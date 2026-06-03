import {
  CATEGORY_MAP,
  CATEGORY_REVERSE_MAP,
} from "../constants/category";

export type CategoryKey = keyof typeof CATEGORY_MAP;

export function normalizeCategory(input: string): CategoryKey {
  return CATEGORY_REVERSE_MAP[input] ?? "unknown";
}

export function getCategoryRu(key: CategoryKey): string {
  return CATEGORY_MAP[key] ?? CATEGORY_MAP.unknown;
}