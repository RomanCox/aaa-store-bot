import { InlineKeyboardButton } from "node-telegram-bot-api";
import { CALLBACK_TYPE, CATALOG_VALUE, SECTION } from "../types";
import { CATALOG_TEXTS } from "../texts";
import { buildCallbackData } from "../utils";
import { COMMON_TEXTS } from "../texts";

const BUTTONS_IN_RAW = 2;

export function brandsKeyboard(
  brands: string[],
  options?: { withAllBtn?: boolean, withDownloadBtn?: boolean, showBack?: boolean }
): InlineKeyboardButton[][] {
	const keyboard: InlineKeyboardButton[][] = [];

	if (options?.withAllBtn) {
		keyboard.push([
			{text: CATALOG_TEXTS.ALL, callback_data: buildCallbackData(CALLBACK_TYPE.BRAND, CATALOG_VALUE.ALL)},
		]);
	}

	for (let i = 0; i < brands.length; i += BUTTONS_IN_RAW) {
		keyboard.push(
			brands.slice(i, i + BUTTONS_IN_RAW).map(brand => ({
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
				callback_data: buildCallbackData(SECTION.CATALOG, CALLBACK_TYPE.DOWNLOAD_XLSX)
			}]
		);
	}


	return keyboard;
}