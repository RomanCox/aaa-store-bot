export enum CALLBACK_TYPE {
	MAIN = "main",
  UPLOAD_XLSX = "upload_xlsx",
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
	EDIT_RETAIL_MULT = "edit_retail_mult",
	EDIT_WHOLESALE_MULT = "edit_wholesale_mult",
	SUBMIT_ORDER = "submit_order",
	ADD_ITEM_TO_CART = "add_item_to_cart",
	CLEAR_CART = "clear_cart",
	EDITING_ORDER = "editing_order",
	EDIT_CART_ITEM = "edit_cart_item",
	INCREASE_AMOUNT = "increase_amount",
	DECREASE_AMOUNT = "decrease_amount",
	DELETE_POSITION_FROM_CART = "delete_product_from_cart",
  ORDERS = "orders",
  CHOOSE_ORDER = "choose_order",
}

export enum PAGINATION {
  NEXT = "next",
  PREV = "prev",
  GOTO = "goto",
}

export enum START_ACTIONS {
	 CHECK_ACCESS = "check_access",
}

export enum CATALOG_VALUE {
	ALL = "all",
}