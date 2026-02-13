import { Product } from "../types";

const TELEGRAM_MESSAGE_LIMIT = 4096;

export function splitMessage(lines: string[], limit = TELEGRAM_MESSAGE_LIMIT): string[] {
	const messages: string[] = [];
	let current = "";

	for (const line of lines) {
		if ((current + line + "\n").length > limit) {
			if (current) messages.push(current.trim());
			current = line + "\n";
		} else {
			current += line + "\n";
		}
	}

	if (current) messages.push(current.trim());
	return messages;
}

function buildLinesWithWordSplit(products: Product[]): string[] {
	const lines: string[] = [];
	let prevFirstWord: string | null = null;

	for (const product of products) {
		const firstWord = product.name.split(" ")[0];

		if (prevFirstWord && prevFirstWord !== firstWord) {
			lines.push(""); // пустая строка
		}

		lines.push(formatProductLine(product));
		prevFirstWord = firstWord;
	}

	return lines;
}

function formatProductLine(product: Product): string {
	const name = product.name
	const price = product.price
	const country = product.country ?? ""

	return `${name} - ${price} ${country}`.trim()
}

function extractStorage(product: Product): string {
	let rest = product.name;

	if (product.brand) {
		rest = rest.replace(product.brand, "").trim();
	}

	if (product.model) {
		rest = rest.replace(product.model, "").trim();
	}

	return rest.split(" ")[0] ?? "";
}

function getProductGroupKey(product: Product): string | null {
	const brand = product.brand?.toLowerCase() ?? "";
	const category = product.category?.toLowerCase() ?? "";
	const model = product.model?.trim() ?? "";

	// === Samsung смартфоны → по первой букве модели ===
	if (brand === "samsung" && category === "смартфоны") {
		const firstLetter = model[0]?.toUpperCase();
		return firstLetter ?? null;
	}

	// === Apple смартфоны → по поколению iPhone ===
	if (brand === "apple" && category === "смартфоны") {
		const parts = model.split(/\s+/);

		// ожидаем ["iPhone", "16e", ...]
		if (parts.length >= 2) {
			const secondWord = parts[1];

			// 16e → 16
			const match = secondWord.match(/\d+/);
			if (match) {
				return match[0];
			}
		}
	}

	return null;
}

function shouldSplitMessage({
															product,
															currentBrand,
															currentCategory,
															prevGroupKey,
														}: {
	product: Product;
	currentBrand: string | null;
	currentCategory: string | null;
	prevGroupKey: string | null;
}): boolean {
	const brand = product.brand ?? "";
	const category = product.category ?? "";

	// 1️⃣ Новый бренд или категория
	if (currentBrand !== brand || currentCategory !== category) {
		return true;
	}

	// 2️⃣ Проверка группировки внутри бренда
	const currentGroupKey = getProductGroupKey(product);

	return !!(prevGroupKey &&
		currentGroupKey &&
		prevGroupKey !== currentGroupKey);
}

export function buildMessages(products: Product[]): string[] {
	const messages: string[] = [];

	let currentMessage = "";
	let currentBrand: string | null = null;
	let currentCategory: string | null = null;

	let prevModel: string | null = null;
	let prevStorage: string | null = null;
	let prevGroupKey: string | null = null;

	for (const product of products) {
		const brand = product.brand ?? "";
		const category = product.category ?? "";

		if (
			shouldSplitMessage({
				product,
				currentBrand,
				currentCategory,
				prevGroupKey,
			})
		) {
			if (currentMessage) {
				messages.push(currentMessage.trim());
			}

			currentMessage = "";
			currentBrand = brand;
			currentCategory = category;
			prevModel = null;
			prevStorage = null;
			prevGroupKey = null;
		}

		const model = product.model ?? "";
		// const model = normalizeModel(product.model ?? "");
		const storage = extractStorage(product);

		// пустая строка при смене модели или памяти
		if (
			currentMessage &&
			(
				(prevModel && model !== prevModel) ||
				(prevStorage && storage !== prevStorage)
			)
		) {
			currentMessage += "\n";
		}

		const line = formatProductLine(product);

		// лимит Telegram
		if ((currentMessage + line + "\n").length > 4096) {
			messages.push(currentMessage.trim());

			currentMessage = "";
			prevModel = null;
			prevStorage = null;
			prevGroupKey = null;
		}

		currentMessage += line + "\n";

		// обновляем groupKey после добавления строки
		const currentGroupKey = getProductGroupKey(product);
		if (currentGroupKey) {
			prevGroupKey = currentGroupKey;
		}

		prevModel = model;
		prevStorage = storage;
	}

	if (currentMessage) {
		messages.push(currentMessage.trim());
	}

	return messages;
}
