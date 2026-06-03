import { ProductFilters, ProductForUI, UserRole } from "../../../types";
import { compareSpecs, extractMemorySubstring } from "../../../utils";
import { getCatalogProducts } from "../catalog.builder";

/**
 * UI ONLY: фильтрация + сортировка каталога для отображения
 * НЕ использовать в:
 * - отчетах
 * - CSV
 * - API
 * - бизнес-логике
 */
export function getCatalogUIProducts(
  filters: ProductFilters,
  role?: UserRole,
): ProductForUI[] {
  const allProducts = getCatalogProducts({ role });
  const visibleProducts = allProducts.filter(p => !p.hidden);

  return sortProducts(
    visibleProducts.filter(p => {
      if (filters.brand && p.brand !== filters.brand) return false;
      if (filters.category && p.category !== filters.category) return false;
      if (filters.model && p.model !== filters.model) return false;

      if (filters.storage) {
        if (p.storage !== filters.storage) return false;
      }

      return true;
    })
  );
}

function sortProducts(products: ProductForUI[]): ProductForUI[] {
  return [...products].sort((a, b) => {
    // 1. Бренд
    const brandCompare = (a.brand ?? "").localeCompare(b.brand ?? "", "ru", {
      sensitivity: "base",
    });
    if (brandCompare !== 0) return brandCompare;

    // 2. Категория
    const categoryCompare = (a.category ?? "").localeCompare(b.category ?? "", "ru", {
      sensitivity: "base",
    });
    if (categoryCompare !== 0) return categoryCompare;

    // 3. Модель (с поддержкой чисел)
    const nameCompare = (a.model ?? "").localeCompare(b.model ?? "", "ru", {
      numeric: true,
      sensitivity: "base",
    });
    if (nameCompare !== 0) return nameCompare;

    // 4. Память (если есть)
    const memA = extractMemorySubstring(a.name ?? null);
    const memB = extractMemorySubstring(b.name ?? null);
    const memCompare = compareSpecs(memA, memB);
    if (memCompare !== 0) return memCompare;

    return (a.name ?? "").localeCompare(b.name ?? "", "ru", {
      numeric: true,
      sensitivity: "base",
    });
  });
}

export function getCatalogProductById(
  id: string | undefined,
  role?: UserRole
): ProductForUI | undefined {
  if (!id) return undefined;

  const all = getCatalogProducts({ role });

  return all.find(p => p.id === id);
}