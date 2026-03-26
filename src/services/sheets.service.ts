import { google } from "googleapis";
import { PriceFormat, PriceType } from "../types";
import { savePriceFormation } from "./price.service";
import { getProducts } from "./products.service";

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
      typeRaw,
      percentRaw
    ] = row;

    const category = categoryRaw?.trim() || undefined;
    const brand = brandRaw?.trim() || undefined;

    const key = [category, brand].filter(Boolean).join("_");

    const max = maxRaw ? Number(maxRaw) : undefined;
    const percent = Number(percentRaw);

    if (!typeRaw || Number.isNaN(percent)) continue;

    const type = typeRaw.trim().toLowerCase() as PriceType;

    if (!map.has(key)) {
      map.set(key, {
        category,
        brand,
        prices: []
      });
    }

    map.get(key)!.prices.push({
      max,
      type,
      percent
    });
  }

  const result = Array.from(map.values());

  try {
    await savePriceFormation(result);
  } catch (error) {
    console.error(error);
  }
}