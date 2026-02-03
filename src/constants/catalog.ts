import { CatalogStep } from "../types/navigation";

export const CatalogBackMap: Record<CatalogStep, CatalogStep | null> = {
	brands: null,
	categories: "brands",
	products: "categories",
};