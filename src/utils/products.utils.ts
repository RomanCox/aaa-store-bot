import { Product } from "../types/product";

export function getBrands(products: Product[]): string[] {
	return Array.from(
		new Set(
			products
				.map(p => p.brand)
				.filter((brand): brand is string => Boolean(brand))
		)
	);
}

export function getCategoriesByBrand(
	products: Product[],
	brand: string
): string[] {
	return Array.from(
		new Set(
			products
				.filter(p => p.brand === brand)
				.map(p => p.category)
				.filter(Boolean)
		)
	);
}
