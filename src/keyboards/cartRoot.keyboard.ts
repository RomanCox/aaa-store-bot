import { InlineKeyboardButton } from "node-telegram-bot-api";
import { CALLBACK_TYPE } from "../types";
import { CART_TEXTS } from "../texts";
import { ProductForCart } from "../types";

export function cartRootKeyboard(currentOrder: ProductForCart[] = []): InlineKeyboardButton[][] {
	const keyboard: InlineKeyboardButton[][] = [];

	if (!currentOrder.length) {
		keyboard.push([
			{text: CART_TEXTS.ADD_POSITION, callback_data: CALLBACK_TYPE.ADD_ITEM_TO_CART},
		]);
	} else {
		keyboard.push([
			{
				text: CART_TEXTS.SUBMIT_ORDER,
				callback_data: CALLBACK_TYPE.SUBMIT_ORDER,
			},
		]);

		keyboard.push([
			{
				text: CART_TEXTS.ADD_POSITION,
				callback_data: CALLBACK_TYPE.ADD_ITEM_TO_CART,
			},
		]);

		keyboard.push([
			{
				text: CART_TEXTS.CHANGE_POSITION,
				callback_data: CALLBACK_TYPE.EDITING_ORDER,
			},
		]);

		keyboard.push([
			{
				text: CART_TEXTS.CLEAR_CART,
				callback_data: CALLBACK_TYPE.CLEAR_CART,
			},
		]);
	}

	// return {inline_keyboard: keyboard};
	return keyboard;
}