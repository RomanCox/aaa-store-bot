import * as XLSX from "xlsx";
import { Product } from "../types/product";
import { resolveBrandFromName } from "./brand-resolver.service";

const COLUMN_MAP: Record<string, keyof Product> = {
	"SKU": "id",
	"Категория": "category",
	"Название": "name",
	"Бренд": "brand",
	"Модель": "model",
	"Хранилище": "storage",
	"Цена": "price",
	"Страна": "country",
	"Тип SIM": "sim",
};

export function parseXlsxToProducts(buffer: Buffer): Product[] {
	const workbook = XLSX.read(buffer, { type: "buffer" });
	const sheetName = workbook.SheetNames[0];
	const sheet = workbook.Sheets[sheetName];

	const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
		defval: "",
	});

	if (!rows.length || !hasRequiredColumns(rows[0])) {
		throw new Error("Неверный формат XLSX файла");
	}

	return rows
		.map(mapRowToProduct)
		.filter(isValidProduct);
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