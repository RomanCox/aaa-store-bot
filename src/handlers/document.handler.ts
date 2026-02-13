import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import path from "path";
import { parseXlsxToProducts } from "../services/xlsx.service";
import { saveProducts } from "../services/products.service";
import { isAdmin } from "../services/users.service";
import { getChatState, registerBotMessage, setChatState } from "../state/chat.state";
import { ADMIN_TEXTS } from "../texts";

export function registerDocumentHandler(bot: TelegramBot) {
	bot.on("document", async (query) => {
		if (!query.from) return;

		const userId = query.from.id;
		const chatId = query.chat.id;
		const state = getChatState(userId);

		if (!isAdmin(chatId)) return;

		if (state.mode !== "upload_xlsx") {
			const msg = await bot.sendMessage(query.chat.id, ADMIN_TEXTS.DONT_WAITING_FILE);
			registerBotMessage(chatId, msg.message_id);
			return;
		}

		const document = query.document;
		if (!document) {
			const msg = await bot.sendMessage(chatId, ADMIN_TEXTS.CANT_FIND_FILE);
			registerBotMessage(chatId, msg.message_id);
			return;
		}

		try {
			const tmpDir = path.resolve("tmp");
			if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

			const filePath = await bot.downloadFile(document.file_id, tmpDir);
			const buffer = fs.readFileSync(filePath);

			const products = parseXlsxToProducts(buffer);

			if (!products.length) {
				const msg = await bot.sendMessage(chatId, ADMIN_TEXTS.ERROR_ITEMS);
				registerBotMessage(chatId, msg.message_id);
				return;
			}

			saveProducts(products);

			const msg = await bot.sendMessage(
				chatId,
				`✅ Прайс успешно загружен\nТоваров: ${products.length}`
			);
			registerBotMessage(chatId, msg.message_id);

			setChatState(userId, { mode: "idle" });
		} catch (error) {
			console.error(ADMIN_TEXTS.ERROR_XLSX, error);
			await bot.sendMessage(chatId, ADMIN_TEXTS.FILE_ERROR);
		}
	});
}