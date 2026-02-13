export interface Product {
	id: string;
	category: string;
	name: string;
	brand?: string;
	model: string;
	storage?: string;
	price: string;
	country?: string;
	sim?: string;
}

export interface ProductForCart extends Product {
	amount: number;
}

export const PRODUCT_XLSX_HEADERS: Record<keyof Product, string> = {
	id: "SKU",
	category: "Категория",
	name: "Название",
	brand: "Бренд",
	model: "Модель",
	storage: "Хранилище",
	price: "Цена",
	country: "Страна",
	sim: "Тип SIM",
};

export interface ProductFilters {
	brand?: string;
	category?: string;
	model?: string;
	storage?: string;
}