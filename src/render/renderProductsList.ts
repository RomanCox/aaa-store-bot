import TelegramBot from "node-telegram-bot-api";
import { buildCallbackData, buildDownloadCallback, buildMessagesForProducts } from "../utils";
import { CALLBACK_TYPE, CatalogSectionState, ProductFilters, SECTION } from "../types";
import { CATALOG_TEXTS } from "../texts";
import { getChatState, getSectionState, setChatState } from "../state/chat.state";
import { renderScreen } from "./renderScreen";
import { getUserRole } from "../services/users.service";
import { getCatalogUIProducts } from "../services/catalog/ui/catalog.ui";

export async function renderProductsList(
  bot: TelegramBot,
  chatId: number,
) {
  const state = getChatState(chatId);
  const catalogState =
    getSectionState(state, SECTION.CATALOG);
  if (!catalogState) return;

  const { selectedBrand, selectedCategory } = catalogState as CatalogSectionState;

  const filter: ProductFilters = {
    brand: selectedBrand,
    category: selectedCategory,
  };
  const role = getUserRole(chatId);

  const products = getCatalogUIProducts(filter, role);

  if (!products.length) {
    setChatState(chatId, {
      mode: "error",
    })

    await renderScreen(bot, chatId, {
      section: SECTION.CATALOG,
      text: CATALOG_TEXTS.UNAVAILABLE,
      withBackButton: true,
    });
    return;
  }

  const userRole = getUserRole(chatId);

  //TODO delete this?
  // const parts = buildMessagesWithProducts(products, userRole);
  const parts = buildMessagesForProducts(products, userRole);
  if (selectedBrand === "Apple" && selectedCategory === "Смартфоны" && parts.length > 0) {
    parts.push({
      text: CATALOG_TEXTS.SIM_LEGEND,
      products: [],
    });
  }

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
    const filters: ProductFilters = {
      brand: selectedBrand,
      category: selectedCategory,
    };
    const downloadKey = buildDownloadCallback(filters);

    // Кнопка только если в этой части есть товары
    const inlineKeyboard = part.products.length > 0
      ? [[{
        text: CATALOG_TEXTS.DOWNLOAD_CATALOG,
        callback_data: buildCallbackData(CALLBACK_TYPE.DOWNLOAD_XLSX, downloadKey),
      }]]
      : undefined;

    // создаём новое сообщение для каждого блока продуктов (keepOldMessage)
    await renderScreen(bot, chatId, {
      section: SECTION.CATALOG,
      text: part.text,
      inlineKeyboard,
      parse_mode: "HTML",
    });
  }
}
