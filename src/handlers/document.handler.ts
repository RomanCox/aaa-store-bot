import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import path from "path";
import { parseXlsxToProducts } from "../services/xlsx.service";
import { saveProducts } from "../services/products.service";
import { isAdmin } from "../services/users.service";
import { getChatState, setChatState } from "../state/chat.state";
import { ADMIN_TEXTS } from "../texts";
import { renderScreen } from "../render/renderScreen";

export function registerDocumentHandler(bot: TelegramBot) {
	bot.on("document", async (query) => {
		if (!query.from) return;

		const userId = query.from.id;
		const chatId = query.chat.id;
		const state = getChatState(userId);

		if (!isAdmin(chatId)) return;

		if (state.mode !== "upload_xlsx") {
      await renderScreen(bot, query.chat.id, ADMIN_TEXTS.DONT_WAITING_FILE);
			return;
		}

		const document = query.document;
		if (!document) {
      await renderScreen(bot, query.chat.id, ADMIN_TEXTS.CANT_FIND_FILE);
			return;
		}

		try {
			const tmpDir = path.resolve("tmp");
			if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

			const filePath = await bot.downloadFile(document.file_id, tmpDir);
			const buffer = fs.readFileSync(filePath);

			const products = parseXlsxToProducts(buffer);

			if (!products.length) {
        await renderScreen(bot, chatId, ADMIN_TEXTS.ERROR_ITEMS)
				return;
			}

			saveProducts(products);

      await renderScreen(bot, chatId, ADMIN_TEXTS.PRICE_UPLOAD_SUCCESS + products.length);

			setChatState(userId, { mode: "idle" });
		} catch (error) {
			await renderScreen(bot, chatId, ADMIN_TEXTS.FILE_ERROR);
		}
	});
}