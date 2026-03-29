import { SECTION, CatalogFlowStep, CartFlowStep, AdminPanelFlowStep, orderFlowStep } from "./navigation";
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

export type AdminPanelSectionState = {
  messageId?: number;
  flowStep: AdminPanelFlowStep;
  users: {
    page?: number;
    totalPages?: number;
    editingUserId?: number;
    newUserId?: number;
  };
};

export interface HomeSectionState {
  messageId?: number;
}

export interface CatalogSectionState {
  messageId?: number;
  lastProductsMessageId?: number;
  flowStep: CatalogFlowStep;

  selectedBrand?: string;
  selectedCategory?: string;

  lastProductGroups?: Product[][];

  hasFileBelow?: boolean;
}

export interface OrdersSectionState {
  messageId?: number;
  flowStep: orderFlowStep;

  page: number;
  totalPages: number;

  selectedUserId?: number;
}

export interface CartSectionState {
  messageId?: number;
  flowStep: CartFlowStep;

  selectedBrand?: string;
  selectedCategory?: string;
  selectedModel?: string;
  selectedStorage?: string;

  selectedProductId?: string;
  selectedAmount?: number;

  selectedProductIdForCart?: string;
  currentOrder?: ProductForCart[];
}

export interface SectionStateMap {
  [SECTION.HOME]: HomeSectionState;
  [SECTION.CATALOG]: CatalogSectionState;
  [SECTION.ORDERS]: OrdersSectionState;
  [SECTION.CART]: CartSectionState;
  [SECTION.ADMIN_PANEL]: AdminPanelSectionState;
}

export interface ChatState {
  uiVersion?: number;
  section: SECTION;
  mode: ChatMode;
  activeMessageId?: number;

  sections: {
    [K in SECTION]?: SectionStateMap[K];
  };
}
