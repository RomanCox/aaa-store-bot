import { InlineKeyboardButton } from "node-telegram-bot-api";
import { CALLBACK_TYPE } from "../types";
import { buildCallbackData } from "../utils";
import { BUTTONS_IN_RAW_FOR_MODELS_KEYBOARD } from "../constants";

export function modelsKeyboard(models: string[]): InlineKeyboardButton[][] {
	const keyboard: InlineKeyboardButton[][] = [];

	for (let i = 0; i < models.length; i += BUTTONS_IN_RAW_FOR_MODELS_KEYBOARD) {
		keyboard.push(
			models.slice(i, i + BUTTONS_IN_RAW_FOR_MODELS_KEYBOARD).map(model => ({
				text: model,
				callback_data: buildCallbackData(CALLBACK_TYPE.MODEL, model),
			}))
		);
	}

	return keyboard;
}