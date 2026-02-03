import fs from "fs";
import path from "path";
import { Product } from "../types/product";

const PRODUCTS_PATH = path.resolve("src/data/products.json");
let products: Product[] = [];

export function saveProducts(products: Product[]) {
	fs.writeFileSync(
		PRODUCTS_PATH,
		JSON.stringify(products, null, 2),
		"utf-8"
	);
}

export function getProducts(
	brand?: string,
	category?: string
): Product[] {
	if (!fs.existsSync(PRODUCTS_PATH)) {
		return [];
	}

	const raw = fs.readFileSync(PRODUCTS_PATH, "utf-8");
	if (!raw) return [];

	try {
		let products = JSON.parse(raw) as Product[];

		if (!Array.isArray(products) || products.length === 0) {
			return [];
		}

		if (brand) {
			products = products.filter(p => p.brand === brand);
		}

		if (category) {
			products = products.filter(p => p.category === category);
		}

		return products;
	} catch (e) {
		console.error("Ошибка чтения products.json", e);
		return [];
	}
}
