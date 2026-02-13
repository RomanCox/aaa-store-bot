import { InlineKeyboardMarkup } from "node-telegram-bot-api";
import { CALLBACK_TYPE, SECTION } from "../types";
import { COMMON_TEXTS } from "../texts";
import { stringWithoutSpaces, buildCallbackData } from "../utils";

const BUTTONS_IN_RAW = 2;

export function modelsKeyboard(models: string[]): InlineKeyboardMarkup {
	const keyboard: InlineKeyboardMarkup["inline_keyboard"] = [];

	for (let i = 0; i < models.length; i += BUTTONS_IN_RAW) {
		keyboard.push(
			models.slice(i, i + BUTTONS_IN_RAW).map(model => ({
				text: model,
				callback_data: buildCallbackData(CALLBACK_TYPE.MODEL, stringWithoutSpaces(model)),
			}))
		);
	}

	keyboard.push(
		 [{text: COMMON_TEXTS.BACK_BUTTON, callback_data: buildCallbackData(CALLBACK_TYPE.BACK, SECTION.CART)}]
	);

	return {inline_keyboard: keyboard};
}