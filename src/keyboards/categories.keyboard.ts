import { InlineKeyboardButton } from "node-telegram-bot-api";
import { CALLBACK_TYPE, CATALOG_VALUE, SECTION } from "../types";
import { COMMON_TEXTS } from "../texts";
import { CATALOG_TEXTS } from "../texts";
import { buildCallbackData } from "../utils";

const BUTTONS_IN_RAW = 2;

export function categoriesKeyboard(
  categories: string[],
  options?: { withAllBtn?: boolean, withDownloadBtn?: boolean }
): InlineKeyboardButton[][] {
	const keyboard: InlineKeyboardButton[][] = [];

	if (options?.withAllBtn) {
		keyboard.push([
			{text: CATALOG_TEXTS.ALL, callback_data: buildCallbackData(CALLBACK_TYPE.CATEGORY, CATALOG_VALUE.ALL)},
		]);
	}

	for (let i = 0; i < categories.length; i += BUTTONS_IN_RAW) {
		keyboard.push(
			categories.slice(i, i + BUTTONS_IN_RAW).map(cat => ({
				text: cat,
				callback_data: buildCallbackData(CALLBACK_TYPE.CATEGORY, cat),
			}))
		);
	}

	keyboard.push(
		 [{text: COMMON_TEXTS.BACK_BUTTON, callback_data: buildCallbackData(CALLBACK_TYPE.BACK, SECTION.CATALOG)}]
	);

	if (options?.withDownloadBtn) {
		keyboard.push(
			[{text: CATALOG_TEXTS.DOWNLOAD_CATALOG, callback_data: buildCallbackData(SECTION.CATALOG, CALLBACK_TYPE.DOWNLOAD_XLSX)}]
		);
	}

	return keyboard;
}