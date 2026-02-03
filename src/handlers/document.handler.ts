import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import path from "path";
import { getUserState, setUserState } from "../state/user.state";
import { parseXlsxToProducts } from "../services/xlsx.service";
import { saveProducts } from "../services/products.service";
import { isAdmin } from "../services/users.service";


export function registerDocumentHandler(bot: TelegramBot) {
	bot.on("document", async (query) => {
		if (!query.from) return;

		const userId = query.from.id;
		const chatId = query.chat.id;
		const state = getUserState(userId);

		if (!isAdmin(chatId)) return;

		if (state.mode !== "upload_xlsx") {
			await bot.sendMessage(query.chat.id, "⛔ Сейчас я не жду файл");
			return;
		}

		const document = query.document;
		if (!document) {
			await bot.sendMessage(chatId, "❌ Файл не найден");
			return;
		}

		try {
			const tmpDir = path.resolve("tmp");
			if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

			const filePath = await bot.downloadFile(document.file_id, tmpDir);
			const buffer = fs.readFileSync(filePath);

			const products = parseXlsxToProducts(buffer);

			if (!products.length) {
				await bot.sendMessage(chatId, "❌ Файл не содержит валидных товаров");
				return;
			}

			saveProducts(products);

			await bot.sendMessage(
				chatId,
				`✅ Прайс успешно загружен\nТоваров: ${products.length}`
			);

			setUserState(userId, { mode: "idle" });
		} catch (error) {
			console.error("❌ XLSX upload error:", error);
			await bot.sendMessage(chatId, "❌ Ошибка при обработке файла");
		}
	});
}