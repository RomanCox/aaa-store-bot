"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSimByRules = normalizeSimByRules;
exports.sortProducts = sortProducts;
exports.getBrands = getBrands;
exports.getCategories = getCategories;
exports.getModels = getModels;
exports.getStorageValues = getStorageValues;
exports.extractFlags = extractFlags;
exports.extractSim = extractSim;
exports.extractActivated = extractActivated;
exports.cleanProductName = cleanProductName;
exports.buildRawName = buildRawName;
exports.replaceStorageInName = replaceStorageInName;
exports.normalizeStorageForCatalog = normalizeStorageForCatalog;
exports.extractConnectivity = extractConnectivity;
exports.hasConnectivity = hasConnectivity;
exports.extractChip = extractChip;
exports.hasChip = hasChip;
exports.extractDisplayFinish = extractDisplayFinish;
exports.normalizeModelForIPadMini = normalizeModelForIPadMini;
const types_1 = require("../types");
const catalog_utils_1 = require("./catalog.utils");
const brands_service_1 = require("../services/brands.service");
const CATEGORY_ORDER = [
    "Смартфоны",
    "Ноутбуки",
    "Компьютер",
    "Планшеты",
    "Наушники",
    "Часы",
    "Джойстики",
    "Аксессуары",
];
function sortByPriority(items, priorityOrder, locale = "ru") {
    const priorityMap = new Map(priorityOrder.map((value, index) => [value, index]));
    return [...items].sort((a, b) => {
        const indexA = priorityMap.get(a);
        const indexB = priorityMap.get(b);
        if (indexA !== undefined && indexB !== undefined) {
            return indexA - indexB;
        }
        if (indexA !== undefined)
            return -1;
        if (indexB !== undefined)
            return 1;
        return a.localeCompare(b, locale, {
            sensitivity: "base",
            numeric: true,
        });
    });
}
function normalizeForCompare(value) {
    return (value ?? "")
        .trim()
        .replace(/\s+/g, "")
        .replace(/-+/g, "-")
        .toUpperCase();
}
function compare(a, b) {
    return normalizeForCompare(a)
        .localeCompare(normalizeForCompare(b), "ru", {
        numeric: true,
        sensitivity: "base",
    });
}
function normalizeSimString(input) {
    const s = input.toLowerCase().replace(/\s+/g, "");
    if (s.includes("esim+") ||
        s.includes("+esim") ||
        s.includes("sim+esim") ||
        s.includes("esim+sim")) {
        return "SIM + ESIM";
    }
    if (s.includes("esim")) {
        return "ESIM";
    }
    if (s.includes("2sim") || s.includes("dual")) {
        return "Dual SIM";
    }
    if (s.includes("1sim") || s.includes("sim")) {
        return "SIM";
    }
    return undefined;
}
function normalizeSimByRules(input) {
    const name = input.name.toLowerCase();
    const country = input.country;
    // 👉 НЕ смартфоны
    if (input.category !== "Смартфоны") {
        return undefined;
    }
    // 🔥 1. приоритет — колонка (1-й прайс)
    if (input.simTypeRaw) {
        return normalizeSimString(input.simTypeRaw);
    }
    // 🔥 2. потом строка (2-й прайс)
    const extracted = extractSim(input.name);
    if (extracted) {
        return extracted;
    }
    // 🔥 3. fallback правила
    if (name.includes("air")) {
        return "ESIM";
    }
    const isIn = (set) => country && set.has(country);
    if (name.includes("iphone 17")) {
        if (isIn(types_1.NEW_SIM_ONLY_COUNTRIES)) {
            return "Dual SIM";
        }
        if (isIn(types_1.NEW_ESIM_ONLY_COUNTRIES)) {
            return "ESIM";
        }
        return "SIM + ESIM";
    }
    if (name.includes("iphone 14") ||
        name.includes("iphone 15") ||
        name.includes("iphone 16")) {
        if (isIn(types_1.OLD_SIM_ONLY_COUNTRIES)) {
            return "Dual SIM";
        }
        if (isIn(types_1.OLD_ESIM_ONLY_COUNTRIES)) {
            return "ESIM";
        }
        return "SIM + ESIM";
    }
    if (name.includes("iphone")) {
        if (isIn(types_1.OLD_SIM_ONLY_COUNTRIES)) {
            return "Dual SIM";
        }
        return "SIM + ESIM";
    }
    return undefined;
}
function sortProducts(products) {
    return [...products].sort((a, b) => compare(a.brand, b.brand) ||
        compare(a.category, b.category) ||
        compare(a.model, b.model) ||
        compare((0, catalog_utils_1.extractModelKey)(a.name ?? ""), (0, catalog_utils_1.extractModelKey)(b.name ?? "")) ||
        (0, catalog_utils_1.compareSpecs)((0, catalog_utils_1.extractMemorySubstring)(a.name), (0, catalog_utils_1.extractMemorySubstring)(b.name)) ||
        compare(a.name, b.name));
}
function getBrands(products) {
    const brandsFromState = (0, brands_service_1.brandsFromConfig)();
    const brands = Array.from(new Set(products
        .map(p => p.brand)
        .filter((brand) => Boolean(brand))
        .filter(brand => brandsFromState.includes(brand))));
    ``;
    return brands.sort((a, b) => {
        const indexA = brandsFromState.indexOf(a);
        const indexB = brandsFromState.indexOf(b);
        return indexA - indexB;
    });
}
function getCategories(products, brand) {
    const categories = Array.from(new Set(products
        .filter(p => p.brand === brand)
        .map(p => p.category)
        .filter(Boolean)));
    return sortByPriority(categories, CATEGORY_ORDER);
}
function getModels(products, brand, category) {
    return Array.from(new Set(products
        .filter(p => (p.brand === brand && p.category === category))
        .map(p => p.model)
        .filter(Boolean)));
}
function getStorageValues(products, brand, category, model) {
    return Array.from(new Set(products
        .filter(p => (p.brand === brand && p.category === category && p.model === model))
        .map(p => p.storage)
        .filter((storage) => typeof storage === "string")));
}
function extractFlags(name) {
    const match = name.match(/[\u{1F1E6}-\u{1F1FF}]{2}/u);
    return match?.[0] ?? "";
}
function extractSim(name) {
    const match = name.match(/\(([^)]*sim[^)]*)\)/i);
    if (!match)
        return undefined;
    const raw = match[1]
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/-/g, "");
    // Разбиваем на компоненты (разделитель +)
    const parts = raw.split('+').map(p => p.trim());
    const hasSim = parts.includes('sim') || parts.includes('1sim');
    const hasEsim = parts.includes('esim');
    const hasDual = parts.includes('2sim') || parts.includes('dual');
    if (hasEsim && hasSim)
        return "SIM + ESIM";
    if (hasEsim)
        return "ESIM";
    if (hasDual)
        return "Dual SIM";
    if (hasSim)
        return "SIM";
    return undefined;
}
function extractActivated(name) {
    return /\(active\)/i.test(name);
}
function cleanProductName(name) {
    return name
        .replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, "") // флаги
        .replace(/\(active\)/gi, "") // (active)
        .replace(/\bactive\b/gi, "") // active без скобок
        .replace(/🔓/g, "") // эмодзи unlocked
        // --- удалить указания на SIM (со скобками и без) ---
        .replace(/\([^)]*(?:sim|esim|eSim|dual|1sim|2sim|1Sim|2Sim)[^)]*\)/gi, '')
        .replace(/\b(?:sim|esim|eSim|dual|1sim|2sim|1Sim|2Sim)\b/gi, '')
        .replace(/\s+/g, " ")
        .trim();
}
function buildRawName(input) {
    let result = input.name;
    // добавляем бренд если его нет
    if (input.brand && !result.toLowerCase().includes(input.brand.toLowerCase())) {
        result = `${input.brand} ${result}`;
    }
    // добавляем sim
    if (input.sim) {
        result += ` (${input.sim})`;
    }
    // activated
    if (input.activated) {
        result += ` (Active)`;
    }
    // страны
    if (input.country?.length) {
        result += ` ${input.country.join(" ")}`;
    }
    return result;
}
function replaceStorageInName(name) {
    const regex = /(\/?)(1024|2048|3072|4096)(\s*)(GB|gb|Gb)?/g;
    return name.replace(regex, (_, slash, size, spaces) => {
        const tbValue = parseInt(size, 10) / 1024;
        const spaceBeforeTB = slash === '/' ? ' ' : '';
        return `${slash}${tbValue}${spaceBeforeTB}TB${spaces}`;
    });
}
const VALID_STORAGES = new Set([64, 128, 256, 512, 1024, 2048, 3072, 4096]);
function normalizeStorageForCatalog(value) {
    const raw = value.trim();
    // 1. Дробь (RAM/Storage) – берём последнее число
    const slashPattern = /(\d+(?:\s*\/\s*\d+)+)(?:\s*(?:GB|Gb|TB|Tb))?/i;
    const slashMatch = raw.match(slashPattern);
    if (slashMatch) {
        const parts = slashMatch[1].split('/').map(p => p.trim());
        const lastPart = parts[parts.length - 1];
        const num = parseInt(lastPart, 10);
        if (!isNaN(num) && VALID_STORAGES.has(num))
            return `${num} GB`;
    }
    // 2. Ищем все числа из допустимого набора, исключая те, которые являются частью модели (например, 17 в "iPhone 17")
    // Ищем числа, которые окружены границами слова \b и не находятся перед словом "iPhone" без пробела?
    // Простой способ: собрать все подходящие числа и выбрать максимальное (или последнее?).
    const possibleNumbers = [];
    for (const storage of VALID_STORAGES) {
        const regex = new RegExp(`\\b${storage}\\b`, 'g');
        let match;
        while ((match = regex.exec(raw)) !== null) {
            possibleNumbers.push(storage);
        }
    }
    if (possibleNumbers.length) {
        // Если несколько, взять максимальное (скорее всего, это объём памяти, а не модель)
        const maxStorage = Math.max(...possibleNumbers);
        return `${maxStorage} GB`;
    }
    // 3. Если число с GB/TB указано явно (например, 256GB)
    const withUnitMatch = raw.match(/\b(\d{2,4})\s*(GB|Gb|TB|Tb)\b/i);
    if (withUnitMatch) {
        let num = parseInt(withUnitMatch[1], 10);
        const unit = withUnitMatch[2].toUpperCase();
        if (unit.startsWith('TB'))
            num *= 1024;
        if (VALID_STORAGES.has(num))
            return `${num} GB`;
    }
    return '';
}
function extractConnectivity(name) {
    const lower = ` ${name.toLowerCase()} `;
    if (/\b(wifi|wi-fi|wireless)\b/.test(lower))
        return "WiFi";
    if (/\b(lte|cellular|5g)\b/.test(lower))
        return "LTE";
    return undefined;
}
function hasConnectivity(name, target) {
    const lower = name.toLowerCase();
    const pattern = target === "WiFi" ? /\b(wifi|wi-fi|wireless)\b/ : /\b(lte|cellular|5g)\b/;
    return pattern.test(lower);
}
function extractChip(name, category) {
    if (category === "Ноутбуки" || category === "Компьютеры") {
        const match = name.match(/\b(M\d+(?:\s*(?:Pro|Max))?)\b/i);
        if (match)
            return match[1].toUpperCase().replace(/\s/g, '');
    }
    else {
        // Для смартфонов и планшетов – ищем A-чипы, не путаем с "Pro Max"
        const match = name.match(/\b(A\d{2,3}[X]?)\b/i);
        if (match)
            return match[1].toUpperCase();
    }
    return undefined;
}
function hasChip(name, chip) {
    const lower = name.toLowerCase();
    const chipLower = chip.toLowerCase();
    // Ищем как отдельное слово, с границами
    const pattern = new RegExp(`\\b${chipLower}\\b`, 'i');
    return pattern.test(lower);
}
function extractDisplayFinish(name) {
    return /\bNano\s*Texture\b/i.test(name) ? "Nano Texture" : "";
}
function normalizeModelForIPadMini(originalModel, fullName) {
    // Если модель уже содержит "iPad mini" в правильном формате, возвращаем её
    if (originalModel.match(/iPad mini \d/))
        return originalModel;
    // Проверяем, что это планшет Apple и в названии есть mini
    const lowerFull = fullName.toLowerCase();
    if (lowerFull.includes("ipad mini")) {
        // Ищем цифру после mini
        const match = fullName.match(/\bmini\s+(\d+)\b/i);
        if (match && /^[1-9]$/.test(match[1])) {
            return `iPad mini ${match[1]}`;
        }
        return "iPad mini";
    }
    return originalModel;
}
