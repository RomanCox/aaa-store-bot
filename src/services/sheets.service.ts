import { google } from "googleapis";
import { PriceFormat } from "../types";
import { savePriceFormation } from "./price.service";
import { saveBrands } from "./brands.service";
import { saveColors } from "./colors.service";

const auth = new google.auth.GoogleAuth({
	keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS!,
	scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheetsService = google.sheets({ version: "v4", auth });

async function getSheet(range: string) {
	const res = await sheetsService.spreadsheets.values.get({
		spreadsheetId: process.env.SPREADSHEET_ID!,
		range,
	});

	return res.data.values ?? [];
}

export async function loadPricesFormats() {
	const rows = await getSheet("'Ценообразование'!A:E");

	if (rows.length < 2) return;

  const [, ...data] = rows;

  const map = new Map<string, PriceFormat>();

  for (const row of data) {
    const [
      categoryRaw,
      brandRaw,
      maxRaw,
      wholesalePercentRaw,
      retailPercentRaw
    ] = row;

    const category = categoryRaw?.trim() || undefined;
    const brand = brandRaw?.trim() || undefined;
    const max = maxRaw ? Number(maxRaw) : undefined;

    const key = [category, brand].filter(Boolean).join("_");

    if (!map.has(key)) {
      map.set(key, {
        category,
        brand,
        prices: []
      });
    }

    const priceFormat = map.get(key)!;

    const wholesalePercent = Number(wholesalePercentRaw);
    if (!Number.isNaN(wholesalePercent) && wholesalePercent !== 0) {
      priceFormat.prices.push({
        max,
        type: 'wholesale',
        value: wholesalePercent
      });
    }

    const retailPercent = Number(retailPercentRaw);
    if (!Number.isNaN(retailPercent) && retailPercent !== 0) {
      priceFormat.prices.push({
        max,
        type: 'retail',
        value: retailPercent
      });
    }
  }

  const result = Array.from(map.values());

  try {
    await savePriceFormation(result);
  } catch (error) {
    console.error(error);
  }
}

export async function loadBrandsFromConfig() {
  const rows = await getSheet("'Брендообразование'!A:C");

  if (rows.length < 2) return;

  const [, ...data] = rows;

  const parsed: { order: number; brand: string; keyWords: string[] }[] = [];

  for (const row of data) {
    const [
      orderRaw,
      brandRaw,
      keyWordsRaw
    ] = row;

    const brand = brandRaw?.trim() || undefined;
    if (!brand) continue;

    // Number("") === 0, поэтому пустую ячейку нужно отличать от нуля явно.
    const orderTrimmed = orderRaw?.trim() ?? "";
    const order = orderTrimmed === "" ? NaN : Number(orderTrimmed);
    const keyWords = (keyWordsRaw?.trim().split('\n') ?? [])
      .map((k: string) => k.trim())
      .filter((k: string) => k !== '');

    // Строки без числа (или с некорректным числом) уходят в конец,
    // сохраняя между собой исходный порядок из таблицы.
    parsed.push({
      order: Number.isFinite(order) ? order : Number.POSITIVE_INFINITY,
      brand,
      keyWords,
    });
  }

  // Сортировка стабильна (ES2019+), поэтому бренды с одинаковым
  // или отсутствующим номером не перемешиваются между собой.
  parsed.sort((a, b) => a.order - b.order);

  const result = parsed.map(({ brand, keyWords }) => ({ [brand]: keyWords }));

  await saveBrands(result);
}

export async function loadColorsFromConfig() {
  const rows = await getSheet("'Цвета'!A:B");

  if (rows.length < 2) return;

  const [, ...data] = rows;

  const result: Record<string, string[]>[] = [];

  for (const row of data) {
    const [
      colorRaw,
      keyWordsRaw
    ] = row;

    const color = colorRaw?.trim() || undefined;
    if (!color) continue;

    const keyWords = (keyWordsRaw?.trim().split('\n') ?? [])
      .map((k: string) => k.trim())
      .filter((k: string) => k !== '');

    result.push({ [color]: keyWords });
  }

  await saveColors(result);
}