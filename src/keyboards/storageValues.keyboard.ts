import { InlineKeyboardMarkup } from "node-telegram-bot-api";
import { CALLBACK_TYPE, SECTION } from "../types";
import { COMMON_TEXTS } from "../texts";
import { buildCallbackData, stringWithoutSpaces } from "../utils";

const BUTTONS_IN_RAW = 2;

export function storageValuesKeyboard(storageValues: string[]): InlineKeyboardMarkup {
	const keyboard: InlineKeyboardMarkup["inline_keyboard"] = [];

	for (let i = 0; i < storageValues.length; i += BUTTONS_IN_RAW) {
		keyboard.push(
			storageValues.slice(i, i + BUTTONS_IN_RAW).map(storageValue => ({
				text: storageValue,
				callback_data: buildCallbackData(CALLBACK_TYPE.STORAGE, stringWithoutSpaces(storageValue)),
			}))
		);
	}

	keyboard.push(
		 [{text: COMMON_TEXTS.BACK_BUTTON, callback_data: buildCallbackData(CALLBACK_TYPE.BACK, SECTION.CART)}]
	);

	return {inline_keyboard: keyboard};
}