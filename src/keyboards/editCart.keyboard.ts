import { InlineKeyboardMarkup } from "node-telegram-bot-api";
import { CALLBACK_TYPE, SECTION } from "../types";
import { COMMON_TEXTS } from "../texts";
import { buildCallbackData } from "../utils";
import { getChatState } from "../state/chat.state";

const BUTTONS_IN_RAW = 5;

export function editCartKeyboard(chatId: number): InlineKeyboardMarkup {
	const keyboard: InlineKeyboardMarkup["inline_keyboard"] = [];

	const state = getChatState(chatId);

	if (state.currentOrder?.length) {
		for (let i = 0; i < state.currentOrder.length; i += BUTTONS_IN_RAW) {
			keyboard.push(
				state.currentOrder.slice(i, i + BUTTONS_IN_RAW).map((product, index) => ({
					text: String(i + index + 1),
					callback_data: buildCallbackData(CALLBACK_TYPE.EDIT_CART_ITEM, product.id),
				}))
			);
		}
	}

	keyboard.push([
		{text: COMMON_TEXTS.BACK_BUTTON, callback_data: buildCallbackData(CALLBACK_TYPE.BACK, SECTION.CART)},
	]);

	return {inline_keyboard: keyboard};
}