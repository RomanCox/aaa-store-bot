import { InlineKeyboardButton } from "node-telegram-bot-api";
import { CALLBACK_TYPE, Product, SECTION } from "../types";
import { CART_TEXTS, COMMON_TEXTS } from "../texts";
import { buildCallbackData } from "../utils";
import { getChatState } from "../state/chat.state";

const BUTTONS_IN_RAW = 4;

export function choosingProductKeyboard(chatId: number, products: Product[]): InlineKeyboardButton[][] {
	const keyboard: InlineKeyboardButton[][] = [];
	const state = getChatState(chatId);

	for (let i = 0; i < products.length; i += BUTTONS_IN_RAW) {
		keyboard.push(
			products.slice(i, i + BUTTONS_IN_RAW).map((product, index) => ({
				text: String(i + index + 1),
				callback_data: buildCallbackData(CALLBACK_TYPE.CHOOSING_PRODUCT, product.id),
			}))
		);
	}

	const bottomRow =  [
		{text: COMMON_TEXTS.BACK_BUTTON, callback_data: buildCallbackData(CALLBACK_TYPE.BACK, SECTION.CART)},
	]

	if (state.sections.cart?.currentOrder?.length) {
		bottomRow.push({
			text: CART_TEXTS.CHECK_CART,
			callback_data: CALLBACK_TYPE.CHECK_CART,
		});
	}

	keyboard.push(bottomRow);

	return keyboard;
}