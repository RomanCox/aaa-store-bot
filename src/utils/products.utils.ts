import { Product, ProductForCatalog } from "../types";
import { compareSpecs, extractMemorySubstring, extractModelKey } from "./catalog.utils";
import { brandsFromConfig } from "../services/brands.service";

const CATEGORY_ORDER = [
	"Смартфоны",
	"Ноутбуки",
  "Компьютер",
	"Планшеты",
	"Наушники",
	"Часы",
  "Джойстики",
	"Аксессуары",
] as const;

function sortByPriority(
	items: string[],
	priorityOrder: readonly string[],
	locale: string = "ru"
): string[] {

	const priorityMap = new Map<string, number>(
		priorityOrder.map((value, index) => [value, index])
	);

	return [...items].sort((a, b) => {
		const indexA = priorityMap.get(a);
		const indexB = priorityMap.get(b);

		if (indexA !== undefined && indexB !== undefined) {
			return indexA - indexB;
		}

		if (indexA !== undefined) return -1;
		if (indexB !== undefined) return 1;

		return a.localeCompare(b, locale, {
			sensitivity: "base",
			numeric: true,
		});
	});
}

function normalizeForCompare(value?: string): string {
	return (value ?? "")
		.trim()
		.replace(/\s+/g, "")
		.replace(/-+/g, "-")
		.toUpperCase();
}

function compare(a?: string, b?: string): number {
	return normalizeForCompare(a)
		.localeCompare(normalizeForCompare(b), "ru", {
			numeric: true,
			sensitivity: "base",
		});
}

export function sortProducts(products: ProductForCatalog[]): ProductForCatalog[] {
  return [...products].sort((a, b) =>
    compare(a.brand, b.brand) ||
    compare(a.category, b.category) ||
    compare(a.model, b.model) ||
    compare(extractModelKey(a.name ?? ""), extractModelKey(b.name ?? "")) ||
    compareSpecs(
      extractMemorySubstring(a.name),
      extractMemorySubstring(b.name)
    ) ||
    compare(a.name, b.name)
  );
}

export function getBrands(products: Product[]): string[] {
  const brandsFromState = brandsFromConfig();
  const brands = Array.from(
		new Set(
			products
				.map(p => p.brand)
				.filter((brand): brand is string => Boolean(brand))
				.filter(brand => brandsFromState.includes(brand))
		)
	);``

  return brands.sort((a, b) => {
    const indexA = brandsFromState.indexOf(a);
    const indexB = brandsFromState.indexOf(b);
    return indexA - indexB;
  });
}

export function getCategories(
	products: Product[],
	brand?: string
): string[] {
	const categories = Array.from(
		new Set(
			products
				.filter(p => p.brand === brand)
				.map(p => p.category)
				.filter(Boolean)
		)
	);

	return sortByPriority(categories, CATEGORY_ORDER);
}

export function getModels(
	products: Product[],
	brand?: string,
	category?: string,
): string[] {
	return Array.from(
		new Set(
			products
				.filter(p => (p.brand === brand && p.category === category))
				.map(p => p.model)
				.filter(Boolean)
		)
	);
}

export function getStorageValues(
	products: Product[],
	brand?: string,
	category?: string,
	model?: string,
): string[] {
	return Array.from(
		new Set(
			products
				.filter(p => (p.brand === brand && p.category === category && p.model === model))
				.map(p => p.storage)
				.filter((storage): storage is string => typeof storage === "string"),
		)
	);
}

