import { ManageUsersStep, SECTION, FlowStep } from "./navigation";
import { Product, ProductForCart } from "./product";

export type ChatMode = "idle"
	| "upload_xlsx"
	| "add_user"
	| "delete_user"
	| "edit_user"
	| "edit_rub_to_byn"
	| "edit_rub_to_usd"
	| "edit_retail_mult"
	| "edit_wholesale_mult"
	| "amount_product_for_cart"
	| "await_users_page_number"
	| "await_orders_page_number"
	| "choose_userId_for_orders"
	| "edit_product_amount_in_cart";

export interface IChatState {
	section?: SECTION;
	mode: ChatMode;

	usersPage?: number;
	usersTotalPages?: number;
  ordersPage?: number;
  ordersTotalPages?: number;

	adminStep?: ManageUsersStep;
	editingUserId?: number;
	newUserId?: number;

	flowStep?: FlowStep;
	selectedBrand?: string;
	selectedCategory?: string;
	selectedModel?: string;
	selectedStorage?: string;
	selectedProductId?: string;
	selectedAmount?: string;
	selectedProductIdForCart?: string;

  lastProductGroups?: Product[][];
	currentOrder?: ProductForCart[];

  currentMessageId?: number;
	messageIds?: number[];
	inlineMessageId?: number;
  replyMessageId?: number;
}
