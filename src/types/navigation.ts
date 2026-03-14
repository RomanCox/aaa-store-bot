export enum SECTION {
  HOME = "home",
	CATALOG = "catalog",
	ORDERS = "orders",
	CART = "cart",
	ADMIN_PANEL = "admin_panel",
}

export type AdminPanelFlowStep = "main" | "upload_xlsx" | "manage_users" | "users_list" | "add_user" | "delete_user" | "edit_user";
export type CatalogFlowStep =
  "brands" |
  "categories" |
  "products";

export type CartFlowStep =
	"main" |
	"brands" |
	"categories" |
	"products" |
	"models" |
	"storage" |
	"products_for_cart" |
	"amount" |
	"edit_cart" |
	"edit_product_in_cart";