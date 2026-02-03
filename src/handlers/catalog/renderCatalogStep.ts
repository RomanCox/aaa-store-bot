import TelegramBot from "node-telegram-bot-api";
import { getProducts } from "../../services/products.service";
import { getBrands, getCategoriesByBrand } from "../../utils/products.utils";
import { splitMessage } from "../../utils/telegram";
import { setChatState, getChatState } from "../../state/chat.state";
import { brandsKeyboard } from "../../keyboards/brands.keyboard";
import { CATALOG_TEXTS } from "../../texts/catalog.texts";
import { categoriesKeyboard } from "../../keyboards/categories.keyboard";
import { COMMON_TEXTS } from "../../texts/common.texts";
import { CALLBACK_TYPE } from "../../types/actions";
import { ChatState } from "../../types/chat";
import { isAdmin } from "../../services/users.service";

async function renderBrands(bot: TelegramBot, chatId: number, products: ReturnType<typeof getProducts>) {
	const userId = chatId;

	const brands = getBrands(products);
	if (!brands.length) {
		const msg = await bot.sendMessage(chatId, CATALOG_TEXTS.UNAVAILABLE);
		setChatState(chatId, {messageIds: [msg.message_id]});
		return;
	}

	const msg = await bot.sendMessage(chatId, CATALOG_TEXTS.CHOOSE_BRAND, {
		reply_markup: brandsKeyboard(brands, { showBack: isAdmin(userId) }),
	});
	setChatState(chatId, {messageIds: [msg.message_id]});
}

async function renderCategories(bot: TelegramBot, chatId: number, state: ChatState, products: ReturnType<typeof getProducts>) {
	if (!state.selectedBrand) return;

	const categories = getCategoriesByBrand(products, state.selectedBrand);
	if (!categories.length) {
		const msg = await bot.sendMessage(chatId, CATALOG_TEXTS.UNAVAILABLE);
		setChatState(chatId, {messageIds: [msg.message_id]});
		return;
	}

	const msg = await bot.sendMessage(chatId, `Категории бренда ${state.selectedBrand}:`, {
		reply_markup: categoriesKeyboard(categories)
	});
	setChatState(chatId, {messageIds: [msg.message_id]});
}

async function renderProducts(bot: TelegramBot, chatId: number, state: ChatState) {
	if (!state.selectedBrand || !state.selectedCategory) return;

	const list = getProducts(state.selectedBrand, state.selectedCategory);

	if (!list || list.length === 0) {
		const msg = await bot.sendMessage(chatId, CATALOG_TEXTS.UNAVAILABLE);
		setChatState(chatId, {messageIds: [msg.message_id]});
		return;
	}

	const text = list.map(p => `${p.name} - ${p.price}`).join("\n");
	const parts = splitMessage(text);

	const sentIds: number[] = [];
	for (const part of parts) {
		const msg = await bot.sendMessage(chatId, part);
		sentIds.push(msg.message_id);
	}

	await bot.editMessageReplyMarkup({
		inline_keyboard: [[{text: COMMON_TEXTS.BACK_BUTTON, callback_data: CALLBACK_TYPE.BACK}]],
	}, {
		chat_id: chatId,
		message_id: sentIds[sentIds.length - 1],
	});

	setChatState(chatId, {messageIds: sentIds});
}

export async function renderCatalogStep(bot: TelegramBot, chatId: number) {
	const state = getChatState(chatId);

	const products = getProducts(state.selectedBrand, state.selectedCategory);

	if (!products || products.length === 0) {
		await bot.sendMessage(chatId, CATALOG_TEXTS.UNAVAILABLE);
		return;
	}

	switch (state.catalogStep) {
		case "brands":
			await renderBrands(bot, chatId, products);
			break;

		case "categories":
			await renderCategories(bot, chatId, state, products);
			break;

		case "products":
			await renderProducts(bot, chatId, state);
			break;

		default:
			break;
	}
}
