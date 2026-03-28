import { google } from "googleapis";
import { PriceFormat } from "../types";
import { savePriceFormation } from "./price.service";
import { saveBrands } from "./brands.service";

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
  const rows = await getSheet("'Брендообразование'!A:B");

  if (rows.length < 2) return;

  const [, ...data] = rows;

  const result: Record<string, string[]>[] = [];

  for (const row of data) {
    const [
      brandRaw,
      keyWordsRaw
    ] = row;

    const brand = brandRaw?.trim() || undefined;
    if (!brand) continue;

    const keyWords = keyWordsRaw?.trim().split('\n').filter((k: string) => k.trim() !== '') || [];

    result.push({ [brand]: keyWords });
  }

  await saveBrands(result);
}