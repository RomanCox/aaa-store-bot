import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import path from "path";
import { parseXlsxToProducts } from "../services/xlsx.service";
import { saveProducts } from "../services/products.service";
import { isAdmin } from "../services/users.service";
import { getChatState, setChatState, updateSectionState } from "../state/chat.state";
import { ADMIN_TEXTS, START_TEXTS } from "../texts";
import { renderScreen } from "../render/renderScreen";
import { SECTION } from "../types";
import { TELEGRAM_MESSAGE_LIMIT } from "../constants";
import { adminKeyboard } from "../keyboards";
import { safeDelete } from "../utils";
import { sendHiddenProductsReport } from "../render/reports";

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

		const document = query.document;
		if (!document) {
      await renderScreen(bot, query.chat.id, { section: SECTION.ADMIN_PANEL, text: ADMIN_TEXTS.CANT_FIND_FILE });
			return;
		}

		try {
      const tmpDir = path.resolve("tmp");
			if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

			const filePath = await bot.downloadFile(document.file_id, tmpDir);
			const buffer = fs.readFileSync(filePath);

			const products = parseXlsxToProducts(buffer);

			if (!products.length) {
        await bot.sendMessage(chatId, ADMIN_TEXTS.ERROR_ITEMS);
				return;
			}

			saveProducts(products);

      const state = getChatState(userId);
      const adminState = state.sections[SECTION.ADMIN_PANEL];
      if (adminState?.messageId) {
        await safeDelete(bot, adminState.messageId);
      }

      updateSectionState(userId, SECTION.ADMIN_PANEL, (prev) => ({
        ...prev,
        messageId: undefined,
      }));

      await bot.sendMessage(chatId, ADMIN_TEXTS.PRICE_UPLOAD_SUCCESS + products.length);

      await sendHiddenProductsReport(bot, chatId, products);

      await renderScreen(bot, chatId, {
        section: SECTION.ADMIN_PANEL,
        text: START_TEXTS.ADMIN_PANEL,
        inlineKeyboard: adminKeyboard(),
        parse_mode: "HTML",
      });

			setChatState(userId, { mode: "idle" });
		} catch (error) {
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