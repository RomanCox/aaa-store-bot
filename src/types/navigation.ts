export enum SECTION {
  MAIN = "main",
	ADMIN = "admin",
	ADMIN_USERS = "admin_users",
	CATALOG = "catalog",
	CATALOG_BRANDS = "catalog_brands",
	CATALOG_CATEGORIES = "catalog_categories",
	CATALOG_PRODUCTS = "catalog_products",
	CART = "cart",
	CATALOG_DOWNLOAD_XLSX = "download_xlsx",
}

export enum NAVIGATION_VALUE {
	CATALOG = "catalog",
	CART = "cart",
	ADMIN = "admin",
}

export type AdminStep = "main" | "users_list" | "upload_xlsx";
export type CatalogStep = "brands" | "categories" | "products";
export type CartStep =
	| "root"
	| "brand"
	| "category"
	| "product"
	| "variant"
	| "quantity";