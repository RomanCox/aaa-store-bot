import { CALLBACK_TYPE, ProductFilters } from "../types";
import { buildCallbackData } from "./callbackBuilder";

export function downloadCatalogHelpers(parts: string[]): ProductFilters {
  const filters: ProductFilters = {};

  for (const part of parts) {
    const [key, value] = part.split('=');

    if (key === 'brand') filters.brand = value;
    if (key === 'category') filters.category = value;
    if (key === 'model') filters.model = value;
    if (key === 'storage') filters.storage = value;
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