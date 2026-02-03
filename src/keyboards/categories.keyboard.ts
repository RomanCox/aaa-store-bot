import { InlineKeyboardMarkup } from "node-telegram-bot-api";
import { CALLBACK_TYPE, CATALOG_VALUE } from "../types/actions";
import { COMMON_TEXTS } from "../texts/common.texts";
import { CATALOG_TEXTS } from "../texts/catalog.texts";
import { SECTION } from "../types/navigation";
import { buildCallbackData } from "../utils/callbackBuilder";

export function categoriesKeyboard(categories: string[]): InlineKeyboardMarkup {
	const keyboard: InlineKeyboardMarkup["inline_keyboard"] = [];

	keyboard.push([
		{text: CATALOG_TEXTS.ALL, callback_data: buildCallbackData(SECTION.CATALOG_CATEGORIES, CATALOG_VALUE.ALL)},
	]);

	for (let i = 0; i < categories.length; i += 2) {
		keyboard.push(
			categories.slice(i, i + 2).map(cat => ({
				text: cat,
				callback_data: buildCallbackData(SECTION.CATALOG_CATEGORIES, cat),
			}))
		);
	}

	keyboard.push(
		[{text: COMMON_TEXTS.BACK_BUTTON, callback_data: buildCallbackData(CALLBACK_TYPE.CATALOG, CALLBACK_TYPE.BACK)}],
		[{text: CATALOG_TEXTS.DOWNLOAD_CATALOG, callback_data: buildCallbackData(CALLBACK_TYPE.CATALOG, CALLBACK_TYPE.DOWNLOAD_XLSX)}]
	);

	return {inline_keyboard: keyboard};
}