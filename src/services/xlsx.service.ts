import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { Product, PRODUCT_XLSX_HEADERS, SECTION } from "../types";
import { resolveBrandFromName } from "./brand-resolver.service";
import { CATALOG_TEXTS } from "../texts";
import TelegramBot from "node-telegram-bot-api";
import { getChatState, getSectionState } from "../state/chat.state";
import { renderScreen } from "../render/renderScreen";

function sortProducts(products: Product[]): Product[] {
	return [...products].sort((a, b) => {
		// 1. Бренд
		const brandCompare = (a.brand ?? "").localeCompare(b.brand ?? "", "ru", {
			sensitivity: "base",
		});
		if (brandCompare !== 0) return brandCompare;

		// 2. Категория
		const categoryCompare = (a.category ?? "").localeCompare(b.category ?? "", "ru", {
			sensitivity: "base",
		});
		if (categoryCompare !== 0) return categoryCompare;

		// 3. Название (с поддержкой чисел)
		return (a.name ?? "").localeCompare(b.name ?? "", "ru", {
			numeric: true,
			sensitivity: "base",
		});
	});
}

export function parseXlsxToProducts(buffer: Buffer): Product[] {
	const workbook = XLSX.read(buffer, {type: "buffer"});
	const sheetName = workbook.SheetNames[0];
	const sheet = workbook.Sheets[sheetName];

	const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
		defval: "",
	});

	if (!rows.length || !hasRequiredColumns(rows[0])) {
		throw new Error("Неверный формат XLSX файла");
	}

	const products = rows
		.map(mapRowToProduct)
		.filter(isValidProduct);

	return sortProducts(products);
}

function hasRequiredColumns(row: Record<string, unknown>): boolean {
	return ["SKU", "Категория", "Название", "Модель", "Цена"]
		.every(col => col in row);
}

function mapRowToProduct(row: Record<string, unknown>): Product {
	const name = String(row["Название"] ?? "").trim();

	return {
		id: String(row["SKU"] ?? "").trim(),
		category: String(row["Категория"] ?? "").trim(),
		name,
		brand: resolveBrandFromName(name),
		model: String(row["Модель"] ?? "").trim(),
		storage: row["Хранилище"] ? String(row["Хранилище"]).trim() : undefined,
		price: String(row["Цена"] ?? "").trim(),
		country: row["Страна"] ? String(row["Страна"]).trim() : undefined,
		sim: row["Тип SIM"] ? String(row["Тип SIM"]).trim() : undefined,
	};
}

function isValidProduct(p: Product): boolean {
	return Boolean(
		p.id &&
		p.category &&
		p.name &&
		p.model &&
		p.price
	);
}

function productsToXlsxData(products: Product[]) {
	const headerRow = Object.values(PRODUCT_XLSX_HEADERS);

	const dataRows = products.map(product =>
		Object.keys(PRODUCT_XLSX_HEADERS).map(key => {
			const value = product[key as keyof Product];
			return value ?? "";
		})
	);

	return [headerRow, ...dataRows];
}

export function generateProductsXlsx(
	products: Product[],
	fileName = "price.xlsx"
): string {
	const sheetData = productsToXlsxData(products);

	const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
	const workbook = XLSX.utils.book_new();

	XLSX.utils.book_append_sheet(workbook, worksheet, "Прайс");

	const filePath = path.resolve("tmp", fileName);

	if (!fs.existsSync("tmp")) {
		fs.mkdirSync("tmp");
	}

	XLSX.writeFile(workbook, filePath);

	return filePath;
}

export async function sendPriceList(
	bot: TelegramBot,
	chatId: number,
	products: Product[]
) {
	if (!products.length) {
		await renderScreen(bot, chatId, { section: SECTION.CATALOG, text: CATALOG_TEXTS.NOT_ITEMS_FOR_DOWNLOAD });
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