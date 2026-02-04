import { AdminStep, CartStep, CatalogStep, SECTION } from "./navigation";

export interface ChatState {
	section?: SECTION;

	adminStep?: AdminStep;

	catalogStep?: CatalogStep;
	selectedBrand?: string;
	selectedCategory?: string;

	cartStep?: CartStep;
	selectedProductId?: string;
	selectedVariantId?: string;

	messageIds?: number[];
	inlineMessageId?: number;
  replyMessageId?: number;
}
