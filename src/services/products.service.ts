import fs from "fs";
import path from "path";
import { Product, ProductFilters } from "../types";
import { priceFormat } from "../utils";
import { getUser } from "./users.service";
import { getPriceFormation } from "./price.service";
import { sortProducts } from "../utils";

const PRODUCTS_PATH = path.resolve(__dirname, "../data/products.json");
let products = new Map<string, Product>();

export const tempExports = new Map<string, string[]>();

export function loadProducts() {
	if (!fs.existsSync(PRODUCTS_PATH)) return;

	const raw = fs.readFileSync(PRODUCTS_PATH, "utf8");
	const list: Product[] = sortProducts(JSON.parse(raw));

	products.clear();

	for (const product of list) {
		products.set(product.id, product);
	}
}

export function saveProducts(list: Product[]) {
	fs.writeFileSync(
		PRODUCTS_PATH,
		JSON.stringify(list, null, 2),
		"utf-8"
	);

	products.clear();
	for (const product of list) {
		products.set(product.id, product);
	}
}

export function getProducts(
	chatId: number,
	filters: ProductFilters = {},
): Product[] {
	const userRole = getUser(chatId)?.role;
	const priceFormation = getPriceFormation();

	return Array.from(products.values())
		.filter(p => {
			if (filters.brand && p.brand !== filters.brand) return false;

			if (filters.category && p.category !== filters.category) return false;

			if (filters.model && p.model !== filters.model) return false;

			if (filters.storage) {
				if (!p.storage) return false;
				if (p.storage !== filters.storage) return false;
			}

			return true;
		})
		.map(product => ({
			...product,
			price: priceFormat(product.price, priceFormation, userRole),
		}))
}

export function getProductById(chatId: number, id?: string): Product | undefined {
  const userRole = getUser(chatId)?.role;
  const priceFormation = getPriceFormation();

  if (!id) return undefined;
  const product = products.get(id);
  if (!product) return undefined;

	return {
    ...product,
    price: priceFormat(product.price, priceFormation, userRole),
  };
}
