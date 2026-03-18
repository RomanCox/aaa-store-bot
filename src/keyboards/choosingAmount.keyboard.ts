import { InlineKeyboardButton } from "node-telegram-bot-api";
import { CALLBACK_TYPE } from "../types";
import { buildCallbackData } from "../utils";
import { BUTTONS_IN_RAW_FOR_AMOUNT_KEYBOARD, MAX_BUTTONS_FOR_AMOUNT_KEYBOARD } from "../constants";

export function choosingAmountKeyboard(): InlineKeyboardButton[][] {
	const keyboard: InlineKeyboardButton[][] = [];

	const numbers = Array.from({ length: MAX_BUTTONS_FOR_AMOUNT_KEYBOARD }, (_, i) => i + 1);

	for (let i = 0; i < numbers.length; i += BUTTONS_IN_RAW_FOR_AMOUNT_KEYBOARD) {
		keyboard.push(
			numbers.slice(i, i + BUTTONS_IN_RAW_FOR_AMOUNT_KEYBOARD).map(num => ({
				text: String(num),
				callback_data: buildCallbackData(CALLBACK_TYPE.CHOOSING_AMOUNT, String(num)),
			}))
		);
	}

	return keyboard;
}