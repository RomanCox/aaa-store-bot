export type Product = {
	id: string;
	category: string;
	name: string;
	model: string;
	storage: string;
	price: string;
	country: string;
	sim: string;
};

export let productsCache: Product[] = [];

export function setProductsCache(products: Product[]) {
	productsCache = products;
}

export function getAllProducts(): Product[] {
	return productsCache;
}

export function getProductsByCategory(category: string) {
	if (category === "Все") return productsCache;
	return productsCache.filter((p) => p.category === category);
}

export function getCategoriesFromCache(): string[] {
	const categories = productsCache
		.map(p => p.category)
		.filter(Boolean);

	return Array.from(new Set(categories));
}