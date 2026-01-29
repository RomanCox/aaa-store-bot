import { google } from "googleapis";
import { type Product, setProductsCache } from "../cache/products.cache";

const auth = new google.auth.GoogleAuth({
	keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS!,
	scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheetsService = google.sheets({ version: "v4", auth });

export async function getSheet(range: string) {
	const res = await sheetsService.spreadsheets.values.get({
		spreadsheetId: process.env.SPREADSHEET_ID!,
		range,
	});

	return res.data.values ?? [];
}

export async function loadProducts() {
	const rows = await getSheet("Товары");

	if (rows.length < 2) return;

	const headers = rows[0];

	const idIdx = headers.indexOf("SKU");
	const categoryIdx = headers.indexOf("Категория");
	const nameIdx = headers.indexOf("Название");
	const modelIdx = headers.indexOf("Модель");
	const storageIdx = headers.indexOf("Хранилище");
	const priceIdx = headers.indexOf("Цена");
	const countryIdx = headers.indexOf("Страна");
	const simIdx = headers.indexOf("Тип SIM");

	if ([idIdx, categoryIdx, nameIdx, modelIdx, storageIdx, priceIdx, countryIdx, simIdx].includes(-1)) {
		throw new Error("Один из обязательных столбцов не найден");
	}

	const products: Product[] = rows.slice(1).map((r) => ({
		id: r[idIdx],
		category: r[categoryIdx],
		name: r[nameIdx],
		model: r[modelIdx],
		storage: r[storageIdx],
		price: r[priceIdx],
		country: r[countryIdx],
		sim: r[simIdx],
	}));

	setProductsCache(products);
}