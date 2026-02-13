import { InlineKeyboardMarkup } from "node-telegram-bot-api";
import { CALLBACK_TYPE, SECTION } from "../types";
import { COMMON_TEXTS } from "../texts";
import { buildCallbackData } from "../utils";

const AMOUNT = 10;
const BUTTONS_IN_RAW = 5;

export function choosingAmountKeyboard(): InlineKeyboardMarkup {
	const keyboard: InlineKeyboardMarkup["inline_keyboard"] = [];

	const numbers = Array.from({ length: AMOUNT }, (_, i) => i + 1);

	for (let i = 0; i < numbers.length; i += BUTTONS_IN_RAW) {
		keyboard.push(
			numbers.slice(i, i + BUTTONS_IN_RAW).map(num => ({
				text: String(num),
				callback_data: buildCallbackData(CALLBACK_TYPE.CHOOSING_AMOUNT, String(num)),
			}))
		);
	}

	keyboard.push(
		 [{text: COMMON_TEXTS.BACK_BUTTON, callback_data: buildCallbackData(CALLBACK_TYPE.BACK, SECTION.CART)}]
	);

	return {inline_keyboard: keyboard};
}