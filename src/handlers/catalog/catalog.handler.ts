import TelegramBot from "node-telegram-bot-api";
import { getProducts } from "../../services/products.service";
import { CATALOG_TEXTS } from "../../texts/catalog.texts";
import { SECTION } from "../../types/navigation";
import { setChatState } from "../../state/chat.state";
import { renderCatalogStep } from "./renderCatalogStep";

export const catalogHandler = async (
	bot: TelegramBot,
	chatId: number,
) => {
	const products = getProducts();

	if (!products || products.length === 0) {
		await bot.sendMessage(chatId, CATALOG_TEXTS.UNAVAILABLE);
		return;
	}

	setChatState(chatId, {
		section: SECTION.CATALOG,
		catalogStep: "brands",
		messageIds: [],
		selectedBrand: undefined,
		selectedCategory: undefined,
	});

	await renderCatalogStep(bot, chatId);
};