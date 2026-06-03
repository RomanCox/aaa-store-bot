"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadColorsFromFile = loadColorsFromFile;
exports.saveColors = saveColors;
exports.resolveColorFromName = resolveColorFromName;
exports.normalizeColorInProductName = normalizeColorInProductName;
const fs_1 = __importDefault(require("fs"));
const constants_1 = require("../constants");
let colors = new Map();
function loadColorsFromFile() {
    if (fs_1.default.existsSync(constants_1.COLORS_PATH)) {
        const data = JSON.parse(fs_1.default.readFileSync(constants_1.COLORS_PATH, 'utf-8'));
        colors.clear();
        for (const [key, value] of Object.entries(data)) {
            colors.set(key, value);
        }
    }
}
async function saveColors(update) {
    const normalizedData = {};
    for (const item of update) {
        const [colorName, keywords] = Object.entries(item)[0];
        normalizedData[colorName] = keywords;
    }
    fs_1.default.writeFileSync(constants_1.COLORS_PATH, JSON.stringify(normalizedData, null, 2), "utf-8");
    colors.clear();
    for (const [colorName, keywords] of Object.entries(normalizedData)) {
        colors.set(colorName, keywords);
    }
}
function resolveColorFromName(name) {
    const lower = name.toLowerCase();
    const entries = Array.from(colors.entries())
        .flatMap(([color, keywords]) => keywords.map(keyword => ({
        color,
        keyword,
    })))
        .sort((a, b) => b.keyword.length - a.keyword.length);
    for (const entry of entries) {
        if (lower.includes(entry.keyword.toLowerCase())) {
            return entry.color;
        }
    }
    return undefined;
}
function normalizeColorInProductName(productName) {
    const lowerName = productName.toLowerCase();
    let bestMatch = null;
    // Перебираем все канонические цвета и их синонимы
    for (const [canonical, synonyms] of colors.entries()) {
        for (const synonym of synonyms) {
            const lowerSynonym = synonym.toLowerCase();
            const index = lowerName.indexOf(lowerSynonym);
            if (index !== -1) {
                const length = synonym.length;
                // Выбираем самое длинное совпадение (чтобы "Space Black" заменилось целиком, а не только "Black")
                if (!bestMatch || length > bestMatch.length) {
                    bestMatch = {
                        synonym,
                        canonical,
                        start: index,
                        end: index + length,
                        length,
                    };
                }
            }
        }
    }
    if (!bestMatch)
        return productName;
    // Замена: часть исходной строки от start до end заменяется на каноническое название цвета
    const before = productName.slice(0, bestMatch.start);
    const after = productName.slice(bestMatch.end);
    let result = `${before}${bestMatch.canonical}${after}`;
    result = result.replace(/\s+/g, ' ').trim();
    return result;
}
