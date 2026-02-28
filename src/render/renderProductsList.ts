import TelegramBot from "node-telegram-bot-api";
import { buildCallbackData, buildMessagesWithProducts } from "../utils";
import { CALLBACK_TYPE, SECTION } from "../types";
import { CATALOG_TEXTS } from "../texts";
import { getProducts, tempExports } from "../services/products.service";
import { getChatState, getSectionState, setChatState } from "../state/chat.state";
import { renderScreen } from "./renderScreen";

export async function renderProductsList(
  bot: TelegramBot,
  chatId: number,
) {
  const state = getChatState(chatId);
  const catalogState = getSectionState(state, SECTION.CATALOG);
  if (!catalogState) return;

  const products = getProducts(chatId, {
    brand: catalogState.selectedBrand,
    category: catalogState.selectedCategory,
  });

  if (!products.length) {
    await renderScreen(bot, chatId, {
      section: SECTION.CATALOG,
      text: CATALOG_TEXTS.UNAVAILABLE,
    });
    return;
  }

  const parts = buildMessagesWithProducts(products);

  // сохраняем lastProductGroups в sections
  setChatState(chatId, {
    sections: {
      ...state.sections,
      [SECTION.CATALOG]: {
        ...catalogState,
        flowStep: "products",
        lastProductGroups: parts.map(p => p.products),
      },
    },
  });

  for (const part of parts) {
    const exportKey = `${chatId}_${Date.now()}`;
    tempExports.set(exportKey, part.products.map(p => p.id));

    // создаём новое сообщение для каждого блока продуктов (keepOldMessage)
    await renderScreen(bot, chatId, {
      section: SECTION.CATALOG,
      text: part.text,
      inlineKeyboard: [[{
        text: CATALOG_TEXTS.DOWNLOAD_CATALOG,
        callback_data: buildCallbackData(CALLBACK_TYPE.DOWNLOAD_XLSX, exportKey),
      }]],
    });
  }
}
