"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPricesFormats = loadPricesFormats;
exports.loadBrandsFromConfig = loadBrandsFromConfig;
exports.loadColorsFromConfig = loadColorsFromConfig;
const googleapis_1 = require("googleapis");
const price_service_1 = require("./price.service");
const brands_service_1 = require("./brands.service");
const colors_service_1 = require("./colors.service");
const auth = new googleapis_1.google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheetsService = googleapis_1.google.sheets({ version: "v4", auth });
async function getSheet(range) {
    const res = await sheetsService.spreadsheets.values.get({
        spreadsheetId: process.env.SPREADSHEET_ID,
        range,
    });
    return res.data.values ?? [];
}
async function loadPricesFormats() {
    const rows = await getSheet("'Ценообразование'!A:E");
    if (rows.length < 2)
        return;
    const [, ...data] = rows;
    const map = new Map();
    for (const row of data) {
        const [categoryRaw, brandRaw, maxRaw, wholesalePercentRaw, retailPercentRaw] = row;
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
        const priceFormat = map.get(key);
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
        await (0, price_service_1.savePriceFormation)(result);
    }
    catch (error) {
        console.error(error);
    }
}
async function loadBrandsFromConfig() {
    const rows = await getSheet("'Брендообразование'!A:B");
    if (rows.length < 2)
        return;
    const [, ...data] = rows;
    const result = [];
    for (const row of data) {
        const [brandRaw, keyWordsRaw] = row;
        const brand = brandRaw?.trim() || undefined;
        if (!brand)
            continue;
        const keyWords = keyWordsRaw?.trim().split('\n').filter((k) => k.trim() !== '') || [];
        result.push({ [brand]: keyWords });
    }
    await (0, brands_service_1.saveBrands)(result);
}
async function loadColorsFromConfig() {
    const rows = await getSheet("'Цвета'!A:B");
    if (rows.length < 2)
        return;
    const [, ...data] = rows;
    const result = [];
    for (const row of data) {
        const [colorRaw, keyWordsRaw] = row;
        const color = colorRaw?.trim() || undefined;
        if (!color)
            continue;
        const keyWords = keyWordsRaw?.trim().split('\n').filter((k) => k.trim() !== '') || [];
        result.push({ [color]: keyWords });
    }
    await (0, colors_service_1.saveColors)(result);
}
