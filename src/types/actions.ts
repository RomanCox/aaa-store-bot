export enum CALLBACK_TYPE {
	MAIN = "main",
  AAA_STORE_PRICE = "upload_aaa_store_price",
  TODAY_THERE_TOMORROW_HERE_PRICE = "upload_today_there_tomorrow_here_price",
  MANAGE_USERS = "manage_users",
	ADD_USER = "add_user",
	DELETE_USER = "delete_user",
  EDIT_USER = "edit_user",
	ROLE_FOR_NEW_USER = "role_for_new_user",
	NEW_ROLE_FOR_EXIST_USER = "new_role_for_exist_user",
	USERS_LIST = "users_list",
	BRAND = "brand",
	CATEGORY = "category",
	CART = "cart",
	CHECK_CART = "check_cart",
	MODEL = "model",
	STORAGE = "storage",
	CHOOSING_PRODUCT = "choosing_product",
	CHOOSING_AMOUNT = "choosing_amount",
	BACK = "back",
	DOWNLOAD_XLSX = "download_xlsx",
	EDIT_RUB_TO_BYN = "edit_rub_to_byn",
	EDIT_RUB_TO_USD = "edit_rub_to_usd",
	EDIT_USD_TO_BYN = "edit_usd_to_byn",
  RENEW_PRICE = "renew_price",
	SUBMIT_ORDER = "submit_order",
	ADD_ITEM_TO_CART = "add_item_to_cart",
	CLEAR_CART = "clear_cart",
	EDITING_ORDER = "editing_order",
	EDIT_CART_ITEM = "edit_cart_item",
	INCREASE_AMOUNT = "increase_amount",
	DECREASE_AMOUNT = "decrease_amount",
	DELETE_POSITION_FROM_CART = "delete_product_from_cart",
  ORDERS = "orders",
  CHOOSE_ORDER = "choose_order"
}

export enum PAGINATION {
  NEXT = "next",
  PREV = "prev",
  GOTO = "goto",
}

export enum CATALOG_VALUE {
	ALL = "all",
}

export type ProductFilters = {
  brand?: string;
  category?: string;
  model?: string;
  storage?: string;
};