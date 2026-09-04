import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import { TMP_PATH } from "../constants";
import {
  ingestAAAStorePrice,
  ingestTodayThereTomorrowHerePrice,
} from "../services/xlsx.service";
import { isAdmin } from "../services/users.service";
import { getChatState, setChatState, updateSectionState } from "../state/chat.state";
import { ADMIN_TEXTS, START_TEXTS } from "../texts";
import { renderScreen } from "../render/renderScreen";
import { IngestItem, IngestSkippedGroup, PriceListType, SECTION } from "../types";
import { adminKeyboard } from "../keyboards";
import { safeDelete } from "../utils";
import { onAiError, onCostReport, onUnresolvedItems, sendHiddenProductsReport, sendSkippedItemsReport, sendUnknownBrandsReport } from "../render/reports";
import { clearCatalogSource, saveCatalog, upsertCatalog } from "../services/catalog/catalog.service";
import { getCatalogProducts } from "../services/catalog/catalog.builder";
import { generateRetailCsv } from "./catalog.hanlder";

async function handleIngestResult(
  bot: TelegramBot,
  chatId: number,
  items: IngestItem[],
  source: PriceListType,
  totalRows: number,
  skipped: IngestSkippedGroup[],
) {
  if (!items.length) {
    await bot.sendMessage(chatId, ADMIN_TEXTS.ERROR_ITEMS);
    return;
  }

  clearCatalogSource(source);

  for (const item of items) {
    upsertCatalog(item.product.id, item.price, source, item.country);
  }

  saveCatalog();

  const result = getCatalogProducts();

  await sendHiddenProductsReport(bot, result);

  const newItemsCount = items.filter(i => i.isNew).length;

  const summaryLines = [
    ADMIN_TEXTS.PRICE_UPLOAD_SUCCESS +
      ADMIN_TEXTS.PRICE_UPLOAD_TOTAL_ROWS + totalRows,
    ADMIN_TEXTS.PRICE_UPLOAD_TOTAL_ITEMS + items.length +
      ADMIN_TEXTS.PRICE_UPLOAD_NEW_ITEMS + newItemsCount,
  ];

  await bot.sendMessage(chatId, summaryLines.join("\n"));

  if (totalRows !== items.length) {
    await sendSkippedItemsReport(bot, skipped);
  }

  generateRetailCsv();
}

export function registerDocumentHandler(bot: TelegramBot) {
	bot.on("document", async (query) => {
		if (!query.from) return;

		const userId = query.from.id;
		const chatId = query.chat.id;
		const state = getChatState(userId);

		if (!isAdmin(chatId)) return;

		if (state.mode !== "upload_xlsx") {
      await renderScreen(bot, query.chat.id, { section: SECTION.ADMIN_PANEL, text: ADMIN_TEXTS.DONT_WAITING_FILE });
			return;
		}

    const flowStep = state.sections.admin_panel?.flowStep;

		const document = query.document;
		if (!document) {
      await renderScreen(bot, query.chat.id, { section: SECTION.ADMIN_PANEL, text: ADMIN_TEXTS.CANT_FIND_FILE });
			return;
		}

		try {
      if (!fs.existsSync(TMP_PATH)) fs.mkdirSync(TMP_PATH, { recursive: true });

			const filePath = await bot.downloadFile(document.file_id, TMP_PATH);
			const buffer = fs.readFileSync(filePath);

      if (flowStep === "upload_aaa_store_price") {
        const { items, totalRows, skipped } = await ingestAAAStorePrice(buffer, {
          onUnknownBrand: async (names) => {
            await sendUnknownBrandsReport(bot, names);
          },
          onAiError: async (names) => {
            await onAiError(bot, names);
          },
          onUnresolvedItems: async (names) => {
            await onUnresolvedItems(bot, names);
          },
          onCostReport: async (totalCost) => {
            await onCostReport(bot, totalCost);
          },
        });

        await handleIngestResult(bot, chatId, items, "AAA-store", totalRows, skipped);
      }

      if (flowStep === "upload_today_there_tomorrow_here_price") {
        const { items, totalRows, skipped } = await ingestTodayThereTomorrowHerePrice(buffer, {
          onUnknownBrand: async (names) => {
            await sendUnknownBrandsReport(bot, names);
          },
          onAiError: async (names) => {
            await onAiError(bot, names);
          },
          onUnresolvedItems: async (names) => {
            await onUnresolvedItems(bot, names);
          },
          onCostReport: async (totalCost) => {
            await onCostReport(bot, totalCost);
          },
        });

        await handleIngestResult(bot, chatId, items, "Today there tomorrow here", totalRows, skipped);
      }

      const state = getChatState(userId);
      const adminState = state.sections[SECTION.ADMIN_PANEL];
      if (adminState?.messageId) {
        await safeDelete(bot, adminState.messageId);
      }

      updateSectionState(userId, SECTION.ADMIN_PANEL, (prev) => ({
        ...prev,
        messageId: undefined,
      }));

      await renderScreen(bot, chatId, {
        section: SECTION.ADMIN_PANEL,
        text: START_TEXTS.ADMIN_PANEL,
        inlineKeyboard: adminKeyboard(),
        parse_mode: "HTML",
      });

			setChatState(userId, { mode: "idle" });
		} catch (error) {
      console.log(error)
      await bot.sendMessage(chatId, ADMIN_TEXTS.FILE_ERROR);

      await renderScreen(bot, chatId, {
        section: SECTION.ADMIN_PANEL,
        text: START_TEXTS.ADMIN_PANEL,
        inlineKeyboard: adminKeyboard(),
        parse_mode: "HTML",
      });
		}
	});
}