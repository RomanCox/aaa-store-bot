export type PriceListType = "AAA-store" | "Today there tomorrow here"

export interface IngestItem {
	product: CachedProduct;
	price: string;
	rawNameForMatch: string;
	isNew: boolean;
}

export interface CachedProduct {
	id: string;

	brand: string;
	category: string;

	name: string;
	model: string;

	attributes?: {
		storage?: string;
		color?: string;
		country?: string;
		sim?: string;
		activated?: boolean;
		// connectivity?: "WiFi" | "LTE" | "";
    // chip?: string;
		// displayFinish?: "Nano Texture" | "";
	};

	rawNames: string[];
}

export interface AiCandidate {
	id: string;
	name: string;
	brand: string;
	category: string;
	model: string;
	storage?: string;
	color?: string;
	sim?: string;
	country?: string;
	activated?: boolean;
	connectivity?: "WiFi" | "LTE" | "";
  chip?: string;
	displayFinish?: "Nano Texture" | "";
}

export interface UpsertProductInput {
	rawName: string;
	brand: string;
	model: string;
	category: string;
	name: string;
	attributes?: {
		storage?: string;
		color?: string;
		country?: string;
		sim?: string;
		activated?: boolean;
		connectivity?: "WiFi" | "LTE" | "";
  	chip?: string;
		displayFinish?: "Nano Texture" | "";
	};
};

export interface CatalogItem {
	productId: string;
	offers: {
		price: string;
		source: PriceListType;
	}[];
}

export interface ProductCore {
	id: string;
	category: string;
	name: string;
	brand?: string;
	model: string;
	storage?: string;
	price: string;
	country?: string;
	sim?: string;
	activated?: boolean;
}

export interface Product extends ProductCore {
	offers?: {
		price: string;
		source: PriceListType;
	}[];
}

export interface ProductForUI extends Product {
	source: PriceListType;
	hidden: boolean;
}

export interface ProductForCart extends Product {
	amount: number;
}

export const PRODUCT_XLSX_HEADERS: Record<keyof ProductCore, string> = {
	id: "SKU",
	category: "Категория",
	name: "Название",
	brand: "Бренд",
	model: "Модель",
	storage: "Хранилище",
	price: "Цена",
	country: "Страна",
	sim: "Тип SIM",
	activated: "Активирован?"
};

export type MatchInput = {
	rawName: string;
	brand: string;
	category: string;
	model: string;
	storage?: string;
	color?: string;
	country?: string;
	sim?: string;
	activated?: boolean;
	connectivity?: "WiFi" | "LTE";
  chip?: string; 
};

export type SimType = "ESIM" | "SIM" | "Dual SIM" | "SIM + ESIM" | undefined;

export const OLD_ESIM_ONLY_COUNTRIES = new Set([
	"🇺🇸","🇵🇷","🇬🇺","🇻🇮",
]);

export const NEW_ESIM_ONLY_COUNTRIES = new Set([
	"🇺🇸","🇵🇷","🇨🇦","🇯🇵","🇲🇽","🇶🇦","🇧🇭","🇰🇼","🇴🇲","🇸🇦","🇦🇪","🇬🇺","🇻🇮",
]);

export const OLD_SIM_ONLY_COUNTRIES = new Set([
	"🇨🇳","🇭🇰","🇲🇴",
]);

export const NEW_SIM_ONLY_COUNTRIES = new Set([
	"🇨🇳",
]);