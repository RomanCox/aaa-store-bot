import { InlineKeyboardButton } from "node-telegram-bot-api";
import { CALLBACK_TYPE, CATALOG_VALUE, SECTION } from "../types";
import { CATALOG_TEXTS } from "../texts";
import { buildCallbackData } from "../utils";
import { COMMON_TEXTS } from "../texts";
import { BUTTONS_IN_RAW_FOR_BRANDS_KEYBOARD } from "../constants";

export function brandsKeyboard(
  brands: string[],
  options?: { withAllBtn?: boolean, withDownloadBtn?: boolean, showBack?: boolean, downloadKey?: string }
): InlineKeyboardButton[][] {
	const keyboard: InlineKeyboardButton[][] = [];

	if (options?.withAllBtn) {
		keyboard.push([
			{text: CATALOG_TEXTS.ALL, callback_data: buildCallbackData(CALLBACK_TYPE.BRAND, CATALOG_VALUE.ALL)},
		]);
	}

	for (let i = 0; i < brands.length; i += BUTTONS_IN_RAW_FOR_BRANDS_KEYBOARD) {
		keyboard.push(
			brands.slice(i, i + BUTTONS_IN_RAW_FOR_BRANDS_KEYBOARD).map(brand => ({
				text: brand,
				callback_data: buildCallbackData(CALLBACK_TYPE.BRAND, brand),
			}))
		);
	}

	if (options?.showBack) {
		keyboard.push([
			{
				text: COMMON_TEXTS.BACK_BUTTON,
				callback_data: buildCallbackData(CALLBACK_TYPE.BACK, SECTION.CATALOG),
			},
		]);
	}

	if (options?.withDownloadBtn) {
		keyboard.push(
			[{
				text: CATALOG_TEXTS.DOWNLOAD_CATALOG,
				callback_data: options.downloadKey
			}]
		);
	}

	return keyboard;
}