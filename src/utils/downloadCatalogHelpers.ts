import { CALLBACK_TYPE, ProductFilters } from "../types";
import { buildCallbackData } from "./callbackBuilder";

export function downloadCatalogHelpers(parts: string[]): ProductFilters {
  const filters: ProductFilters = {};

  for (const part of parts) {
    const [key, value] = part.split('=');

    if (key === 'b') filters.brand = value;
    if (key === 'c') filters.category = value;
    if (key === 'm') filters.model = value;
    if (key === 's') filters.storage = value;
  }

  return filters;
}

export function serializeFilters(filters: ProductFilters): string[] {
  const parts: string[] = [];

  if (filters.brand) parts.push(`b=${filters.brand}`);
  if (filters.category) parts.push(`c=${filters.category}`);
  if (filters.model) parts.push(`m=${filters.model}`);
  if (filters.storage) parts.push(`s=${filters.storage}`);

  if (!parts.length) {
    parts.push('all=true');
  }

  return parts;
}

export function buildDownloadCallback(filters: ProductFilters) {
  return buildCallbackData(CALLBACK_TYPE.DOWNLOAD_XLSX, ...serializeFilters(filters));
}