import { InlineKeyboardButton } from "node-telegram-bot-api";
import { CALLBACK_TYPE, SECTION } from "../types";
import { CART_TEXTS, COMMON_TEXTS } from "../texts";
import { buildCallbackData } from "../utils";

export function editProductInCartKeyboard(productAmount: number): InlineKeyboardButton[][] {
	const keyboard: InlineKeyboardButton[][] = [];

	keyboard.push([
		{text: COMMON_TEXTS.PLUS_BUTTON, callback_data: CALLBACK_TYPE.INCREASE_AMOUNT},
	]);

	if (productAmount > 1) {
		keyboard.push([
			{text: COMMON_TEXTS.MINUS_BUTTON, callback_data: CALLBACK_TYPE.DECREASE_AMOUNT},
		]);
	}

	keyboard.push([
		{text: CART_TEXTS.DELETE_POSITION, callback_data: CALLBACK_TYPE.DELETE_POSITION_FROM_CART},
	]);

	keyboard.push([
		{text: COMMON_TEXTS.BACK_BUTTON, callback_data: buildCallbackData(CALLBACK_TYPE.BACK, SECTION.CART)},
	]);

	return keyboard;
}