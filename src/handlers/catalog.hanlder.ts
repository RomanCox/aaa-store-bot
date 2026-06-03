import TelegramBot from "node-telegram-bot-api";
import { ProductForUI, SECTION } from "../types";
import { renderScreen } from "../render/renderScreen";
import { CATALOG_TEXTS } from "../texts";
import { getChatState, getSectionState } from "../state/chat.state";
import { exportToCsv, generateProductsXlsx } from "../services/catalog/catalog.export";
import fs from "fs";
import { getCatalogProducts } from "../services/catalog/catalog.builder";
import { saveCsvToFile } from "../utils/file.service";

export async function sendPriceList(
  bot: TelegramBot,
  chatId: number,
  products: ProductForUI[]
) {
  if (!products.length) {
    await renderScreen(bot, chatId, {section: SECTION.CATALOG, text: CATALOG_TEXTS.NOT_ITEMS_FOR_DOWNLOAD});
    return;
  }

  const state = getChatState(chatId);
  const catalogState = getSectionState(state, SECTION.CATALOG);

  const parts = ["price", catalogState?.selectedBrand, catalogState?.selectedCategory].filter(Boolean);
  const fileName = `${parts.join("_")}.xlsx`;

  const filePath = generateProductsXlsx(products, fileName);

  await bot.sendDocument(
    chatId,
    fs.createReadStream(filePath),
    {
      caption: CATALOG_TEXTS.PRICE_LIST,
    },
    {
      filename: fileName,
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }
  );
}

export function generateRetailCsv(): void {
  const products = getCatalogProducts({role: "retail"});

  const visibleProducts = products.filter(p => !p.hidden);

  const csv = exportToCsv(visibleProducts);

  saveCsvToFile(csv);
}