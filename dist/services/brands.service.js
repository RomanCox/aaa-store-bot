"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadBrandsFromFile = loadBrandsFromFile;
exports.saveBrands = saveBrands;
exports.resolveBrandFromName = resolveBrandFromName;
exports.brandsFromConfig = brandsFromConfig;
exports.extractBrandFromStart = extractBrandFromStart;
const fs_1 = __importDefault(require("fs"));
const constants_1 = require("../constants");
let brands = new Map();
function loadBrandsFromFile() {
    if (fs_1.default.existsSync(constants_1.BRANDS_PATH)) {
        const data = JSON.parse(fs_1.default.readFileSync(constants_1.BRANDS_PATH, 'utf-8'));
        brands.clear();
        for (const [key, value] of Object.entries(data)) {
            brands.set(key, value);
        }
    }
}
async function saveBrands(update) {
    const normalizedData = {};
    for (const item of update) {
        const [brandName, keywords] = Object.entries(item)[0];
        normalizedData[brandName] = keywords;
    }
    fs_1.default.writeFileSync(constants_1.BRANDS_PATH, JSON.stringify(normalizedData, null, 2), "utf-8");
    brands.clear();
    for (const [brandName, keywords] of Object.entries(normalizedData)) {
        brands.set(brandName, keywords);
    }
}
function resolveBrandFromName(name) {
    const trimmedName = name.trim().toLowerCase();
    for (const [brand, keyWords] of brands.entries()) {
        if (keyWords.some(keyWord => trimmedName.startsWith(keyWord.toLowerCase()))) {
            return brand;
        }
    }
    return undefined;
}
function brandsFromConfig() {
    return Array.from(brands.keys());
}
function extractBrandFromStart(name) {
    const original = name.trimStart();
    const lower = original.toLowerCase();
    let matchedBrand;
    let matchedLength = 0;
    for (const [brand, keyWords] of brands.entries()) {
        for (const keyWord of keyWords) {
            const key = keyWord.toLowerCase();
            if (lower.startsWith(key) && key.length > matchedLength) {
                matchedBrand = brand;
                matchedLength = key.length;
            }
        }
    }
    if (!matchedBrand) {
        return {
            brand: undefined,
            nameWithoutBrand: original,
        };
    }
    // обрезаем бренд + пробел после него
    const nameWithoutBrand = original.slice(matchedLength).trimStart();
    return {
        brand: matchedBrand,
        nameWithoutBrand,
    };
}
