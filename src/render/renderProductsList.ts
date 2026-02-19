import TelegramBot from "node-telegram-bot-api";
import { buildCallbackData, buildMessagesWithProducts } from "../utils";
import { CALLBACK_TYPE } from "../types";
import { CATALOG_TEXTS } from "../texts";
import { getProducts, tempExports } from "../services/products.service";
import { getChatState, setChatState } from "../state/chat.state";
import { renderScreen } from "./renderScreen";

export async function renderProductsList(
	bot: TelegramBot,
	chatId: number,
) {
	const state = getChatState(chatId);
	const products = getProducts(chatId, {
		brand: state.selectedBrand,
		category: state.selectedCategory,
	});

	if (!products.length) {
    await renderScreen(bot, chatId, CATALOG_TEXTS.UNAVAILABLE);
		return;
	}

	const parts = buildMessagesWithProducts(products);

  setChatState(chatId, {
    lastProductGroups: parts.map(p => p.products)
  });
  for (const part of parts) {
    const exportKey = `${chatId}_${Date.now()}`;
    tempExports.set(exportKey, part.products.map(p => p.id));

    await renderScreen(bot, chatId, part.text, [[{
      text: CATALOG_TEXTS.DOWNLOAD_CATALOG,
      callback_data: buildCallbackData(CALLBACK_TYPE.DOWNLOAD_XLSX, exportKey),
    }]]);
  }
}