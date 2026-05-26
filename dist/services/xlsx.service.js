"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestAAAStorePrice = ingestAAAStorePrice;
exports.ingestTodayThereTomorrowHerePrice = ingestTodayThereTomorrowHerePrice;
const XLSX = __importStar(require("xlsx"));
const productAI_1 = require("../ai/productAI");
const utils_1 = require("../utils");
const brands_service_1 = require("./brands.service");
const product_builder_1 = require("./products/product.builder");
const products_service_1 = require("./products/products.service");
const constants_1 = require("../constants");
const colors_service_1 = require("./colors.service");
function hasRequiredColumns(row) {
    return ["SKU", "Категория", "Название", "Модель", "Цена"]
        .every(col => col in row);
}
function getCategory(name) {
    const normalizeString = name.toLowerCase();
    if (normalizeString.includes("iphone"))
        return "Смартфоны";
    if (normalizeString.includes("macbook"))
        return "Ноутбуки";
    if (normalizeString.includes("mac "))
        return "Компьютер";
    if (normalizeString.includes("ipad"))
        return "Планшеты";
    if (normalizeString.includes("airpods"))
        return "Наушники";
    if (normalizeString.includes("watch"))
        return "Часы";
    if (normalizeString.includes("display"))
        return "Монитор";
    return "Аксессуары";
}
async function processItem(input) {
    const { rawNameForMatch, rawName, price, brand, category, model, storage, color, country, sim, activated, connectivity, chip, isAppleSmartphone } = input;
    const match = (0, products_service_1.matchProduct)({
        rawName: rawNameForMatch,
        brand,
        category,
        model,
        storage,
        color,
        sim,
        activated,
        connectivity,
        chip,
    });
    if (match?.product) {
        (0, product_builder_1.addRawNameIfNeeded)(match.product, rawNameForMatch);
        return {
            product: match.product,
            price,
            rawNameForMatch,
            isNew: false,
        };
    }
    const product = (0, product_builder_1.upsertProduct)({
        rawName: rawNameForMatch,
        brand,
        category,
        model,
        name: rawName,
        attributes: {
            storage: storage,
            color: color,
            country: isAppleSmartphone ? undefined : country,
            sim,
            activated,
            connectivity,
            chip,
        },
    });
    if (!product)
        return;
    return { product, price, rawNameForMatch, isNew: true, };
}
async function ingestAAAStorePrice(buffer, options) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, {
        defval: "",
    });
    if (!rows.length || !hasRequiredColumns(rows[0])) {
        throw new Error("Неверный формат XLSX файла");
    }
    const result = [];
    const unknownBrands = new Set();
    const unresolvedItems = new Set();
    const aiErrors = new Set();
    const chunkSize = 15;
    let unsavedCount = 0;
    let totalAICost = 0;
    for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const chunkResults = await Promise.all(chunk.map(async (row) => {
            const category = String(row["Категория"] ?? "").trim();
            const name = String(row["Название"] ?? "").trim();
            const model = String(row["Модель"] ?? "").trim();
            const storageRaw = String(row["Хранилище"] ?? "").trim();
            const price = String(row["Цена"] ?? "").trim();
            const country = String(row["Страна"] ?? "");
            const simTypeRaw = String(row["Тип SIM"] ?? "");
            if (!name || !price)
                return;
            const brand = (0, brands_service_1.resolveBrandFromName)(name);
            if (!brand) {
                unknownBrands.add(name);
                return;
            }
            let finalModel = model;
            if (brand === "Apple" && category === "Планшеты") {
                finalModel = (0, utils_1.normalizeModelForIPadMini)(finalModel, name);
            }
            const color = (0, colors_service_1.resolveColorFromName)(name);
            const isAppleSmartphone = brand === "Apple" && category === "Смартфоны";
            const sim = (0, utils_1.normalizeSimByRules)({
                name,
                category,
                country,
                simTypeRaw,
            });
            const displayFinish = (0, utils_1.extractDisplayFinish)(name);
            const rawNameForMatch = (0, product_builder_1.buildAAAStoreRawName)({
                name,
                country: isAppleSmartphone ? undefined : country,
                sim,
            });
            // 1. Прямой поиск по rawName
            let match = (0, products_service_1.findByRawName)(rawNameForMatch);
            if (match) {
                return {
                    product: match,
                    price,
                    rawNameForMatch,
                    isNew: false,
                };
            }
            // 2. Извлечение атрибутов через AI (один запрос)
            const extracted = await (0, productAI_1.extractProductAttributes)(name, category);
            if (!extracted.attrs) {
                unresolvedItems.add(name);
                return;
            }
            let { model: extractedModel, connectivity, chip } = extracted.attrs;
            const { cost } = extracted;
            if (cost !== null)
                totalAICost += cost;
            if (brand === "Apple" && category === "Планшеты") {
                extractedModel = (0, utils_1.normalizeModelForIPadMini)(extractedModel, name);
            }
            // 3. Фильтрация кандидатов
            const cachedProducts = (0, products_service_1.getProductCache)();
            const candidates = [...cachedProducts.values()].filter(p => {
                if (p.brand !== brand)
                    return false;
                if (p.category !== category)
                    return false;
                const storage = storageRaw.length ? storageRaw : (0, utils_1.normalizeStorageForCatalog)(name);
                if (storage && (0, utils_1.normalizeStorageForCatalog)(p.attributes?.storage || "") !== storage)
                    return false;
                if (sim && p.attributes?.sim !== sim)
                    return false;
                if (connectivity) {
                    const match = p.rawNames.some(raw => (0, utils_1.hasConnectivity)(raw, connectivity)) ||
                        (0, utils_1.hasConnectivity)(p.name, connectivity);
                    if (!match)
                        return false;
                }
                if (chip) {
                    const match = p.rawNames.some(raw => (0, utils_1.hasChip)(raw, chip)) ||
                        (0, utils_1.hasChip)(p.name, chip);
                    if (!match)
                        return false;
                }
                if (displayFinish && p.attributes?.displayFinish !== displayFinish)
                    return false;
                return true;
            }).map(p => ({
                id: p.id,
                name: p.name,
                brand: p.brand,
                category: p.category,
                model: p.model,
                storage: p.attributes?.storage ?? "",
                color: p.attributes?.color,
                connectivity: p.attributes?.connectivity,
                chip: p.attributes?.chip,
                displayFinish: p.attributes?.displayFinish,
            }));
            let matchedProduct = null;
            // 4. Детерминированный поиск по model (извлечённой AI)
            if (extractedModel) {
                const foundCandidate = candidates.find(p => p.model.toLowerCase() === extractedModel.toLowerCase() &&
                    (!storageRaw || (0, utils_1.normalizeStorageForCatalog)(p.storage) === (0, utils_1.normalizeStorageForCatalog)(storageRaw)) &&
                    (!connectivity || p.connectivity === connectivity) &&
                    (!chip || p.chip === chip) &&
                    (!color || p.color === color));
                if (foundCandidate) {
                    const candidateProduct = await (0, products_service_1.getProductFromCacheById)(foundCandidate.id);
                    if (candidateProduct) {
                        const incomingColor = color;
                        const candidateColor = candidateProduct.attributes?.color;
                        if (incomingColor && candidateColor && incomingColor.toLowerCase() !== candidateColor.toLowerCase()) {
                            aiErrors.add(name);
                        }
                        else {
                            matchedProduct = candidateProduct;
                        }
                    }
                }
            }
            // 5. AI‑матчинг (если не нашли и есть кандидаты)
            if (!matchedProduct && candidates.length > 0) {
                const { result: ai, cost: matchCost } = await (0, productAI_1.callAIForProductMatch)(name, candidates);
                if (matchCost !== null)
                    totalAICost += matchCost;
                if (!ai || ai.status === "error") {
                    aiErrors.add(name);
                    return;
                }
                if (ai.status === "matched" && ai.productId) {
                    matchedProduct = await (0, products_service_1.getProductFromCacheById)(ai.productId);
                }
            }
            // 6. Если нашли – добавляем синоним и возвращаем
            if (matchedProduct) {
                (0, product_builder_1.addRawNameIfNeeded)(matchedProduct, name);
                return { product: matchedProduct, price, rawNameForMatch, isNew: false };
            }
            // 7. Не нашли – создаём новый товар
            const finalStorage = storageRaw.length ? storageRaw : (0, utils_1.normalizeStorageForCatalog)(name);
            const finalCountry = isAppleSmartphone ? undefined : country;
            const newProduct = (0, product_builder_1.upsertProduct)({
                rawName: name,
                brand,
                category,
                model: model || extractedModel || "",
                name: name,
                attributes: {
                    storage: finalStorage,
                    color,
                    country: finalCountry,
                    sim,
                    connectivity: connectivity || undefined,
                    chip: chip || undefined,
                    displayFinish: displayFinish || undefined,
                },
            });
            return { product: newProduct, price, rawNameForMatch, isNew: true };
        }));
        const grouped = new Map();
        for (const item of chunkResults) {
            if (!item)
                continue;
            // 👇 ключ — товар в рамках ПРАЙСА, а не кеша
            const key = item.rawNameForMatch + "|" + item.product.id;
            const existing = grouped.get(key);
            if (!existing) {
                grouped.set(key, item);
                continue;
            }
            if (Number(item.price) < Number(existing.price)) {
                grouped.set(key, item);
            }
        }
        const valid = [...grouped.values()];
        result.push(...valid);
        unsavedCount += valid.length;
        if (unsavedCount >= constants_1.SAVE_EVERY_NUMBER_ITEMS) {
            (0, products_service_1.saveProductCache)();
            unsavedCount = 0;
        }
    }
    if (unknownBrands.size && options?.onUnknownBrand) {
        await options.onUnknownBrand([...unknownBrands]);
    }
    if (aiErrors.size && options?.onAiError) {
        await options.onAiError([...aiErrors]);
    }
    if (unresolvedItems.size && options?.onUnresolvedItems) {
        await options.onUnresolvedItems([...unresolvedItems]);
    }
    if (totalAICost > 0 && options?.onCostReport) {
        await options.onCostReport(totalAICost);
    }
    (0, products_service_1.saveProductCache)();
    return result;
}
async function ingestTodayThereTomorrowHerePrice(buffer, options) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const range = XLSX.utils.decode_range(sheet["!ref"]);
    const rows = [];
    for (let r = 0; r <= range.e.r; r++) {
        const name = sheet[XLSX.utils.encode_cell({ r, c: 0 })]?.v?.toString().trim() ?? "";
        const priceRaw = sheet[XLSX.utils.encode_cell({ r, c: 1 })]?.v?.toString().trim() ?? "";
        if (!name || !priceRaw)
            continue;
        const price = String(Number(priceRaw) + constants_1.TODAY_THERE_TOMORROW_HERE_PRICE_DELIVERY);
        rows.push({ name, price });
    }
    const result = [];
    const unknownBrands = new Set();
    const unresolvedItems = new Set();
    const aiErrors = new Set();
    const chunkSize = 15;
    let unsavedCount = 0;
    let totalAICost = 0;
    for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const chunkResults = await Promise.all(chunk.map(async ({ name, price }) => {
            const { brand, nameWithoutBrand } = (0, brands_service_1.extractBrandFromStart)(name);
            if (!brand || !nameWithoutBrand) {
                unknownBrands.add(name);
                return;
            }
            const category = getCategory(name);
            const country = (0, utils_1.extractFlags)(name);
            const color = (0, colors_service_1.resolveColorFromName)(name);
            const storage = (0, utils_1.normalizeStorageForCatalog)(name);
            let nameForCatalog = (0, utils_1.cleanProductName)(nameWithoutBrand);
            nameForCatalog = (0, colors_service_1.normalizeColorInProductName)(nameForCatalog);
            const isAppleSmartphone = brand === "Apple" && category === "Смартфоны";
            const activated = (0, utils_1.extractActivated)(name);
            const sim = (0, utils_1.extractSim)(name) ?? (0, utils_1.normalizeSimByRules)({ name, category, country });
            const displayFinish = (0, utils_1.extractDisplayFinish)(name);
            const rawNameForMatch = (0, product_builder_1.buildTodayThereTomorrowHereRawName)({
                name,
                sim,
                activated,
            });
            // 1. Поиск по rawName
            let existingByRaw = null;
            if (activated === true) {
                // Ищем только среди активных продуктов
                const cache = (0, products_service_1.getProductCache)();
                existingByRaw = [...cache.values()].find(p => p.attributes?.activated === true &&
                    p.rawNames.some(raw => (0, product_builder_1.normalize)(raw) === (0, product_builder_1.normalize)(rawNameForMatch)));
            }
            else {
                existingByRaw = (0, products_service_1.findByRawName)(rawNameForMatch);
            }
            if (existingByRaw) {
                (0, product_builder_1.addRawNameIfNeeded)(existingByRaw, rawNameForMatch);
                return {
                    product: existingByRaw,
                    price,
                    rawNameForMatch,
                    isNew: false,
                };
            }
            // 2. Извлечение атрибутов через AI (один запрос)
            const extracted = await (0, productAI_1.extractProductAttributes)(name, category);
            if (!extracted.attrs) {
                unresolvedItems.add(name);
                return;
            }
            const { attrs: { model, connectivity, chip }, cost } = extracted;
            if (cost !== null)
                totalAICost += cost;
            if (category === "Аксессуары") {
                unresolvedItems.add(name);
                return;
            }
            // 3. Фильтрация кандидатов с учётом извлечённых полей
            const cachedProducts = (0, products_service_1.getProductCache)();
            const candidates = [...cachedProducts.values()].filter(p => {
                if (p.brand !== brand)
                    return false;
                if (p.category !== category)
                    return false;
                if (storage && (0, utils_1.normalizeStorageForCatalog)(p.attributes?.storage || "") !== storage)
                    return false;
                if (sim && p.attributes?.sim !== sim)
                    return false;
                if (connectivity) {
                    const match = p.rawNames.some(raw => (0, utils_1.hasConnectivity)(raw, connectivity)) ||
                        (0, utils_1.hasConnectivity)(p.name, connectivity);
                    if (!match)
                        return false;
                }
                if (chip) {
                    const match = p.rawNames.some(raw => (0, utils_1.hasChip)(raw, chip)) ||
                        (0, utils_1.hasChip)(p.name, chip);
                    if (!match)
                        return false;
                }
                if (displayFinish && p.attributes?.displayFinish !== displayFinish)
                    return false;
                return true;
            }).map(p => ({
                id: p.id,
                name: p.name,
                brand: p.brand,
                category: p.category,
                model: p.model,
                storage: p.attributes?.storage ?? "",
                color: p.attributes?.color,
                connectivity: p.attributes?.connectivity,
                chip: p.attributes?.chip,
                displayFinish: p.attributes?.displayFinish,
            }));
            let matchedProduct = null;
            // 4. Детерминированный поиск по model (если есть)
            if (model) {
                const foundCandidate = candidates.find(p => p.model.toLowerCase() === model.toLowerCase() &&
                    (!storage || (0, utils_1.normalizeStorageForCatalog)(p.storage) === storage) &&
                    (!connectivity || p.connectivity === connectivity) &&
                    (!chip || p.chip === chip) &&
                    (!color || p.color === color));
                if (foundCandidate) {
                    const candidateProduct = await (0, products_service_1.getProductFromCacheById)(foundCandidate.id);
                    if (candidateProduct) {
                        // Пост-проверка цвета
                        const incomingColor = (0, colors_service_1.resolveColorFromName)(name);
                        const candidateColor = candidateProduct.attributes?.color;
                        if (incomingColor && candidateColor && incomingColor.toLowerCase() !== candidateColor.toLowerCase()) {
                            // Несоответствие цвета — отклоняем матч
                            aiErrors.add(name);
                        }
                        else {
                            matchedProduct = candidateProduct;
                        }
                    }
                }
            }
            // 5. Если не нашли – AI-матчинг (только если есть кандидаты)
            if (!matchedProduct && candidates.length > 0) {
                const { result: ai, cost: matchCost } = await (0, productAI_1.callAIForProductMatch)(name, candidates);
                if (matchCost !== null)
                    totalAICost += matchCost;
                if (!ai || ai.status === "error") {
                    aiErrors.add(name);
                    return;
                }
                if (ai.status === "matched" && ai.productId) {
                    matchedProduct = await (0, products_service_1.getProductFromCacheById)(ai.productId);
                }
            }
            // 6. Если всё ещё не нашли – создаём новый продукт (без второго AI-запроса)
            if (!matchedProduct) {
                const finalCountry = isAppleSmartphone ? undefined : country;
                const newProduct = (0, product_builder_1.upsertProduct)({
                    rawName: rawNameForMatch,
                    brand,
                    category,
                    model: model,
                    name: nameForCatalog,
                    attributes: {
                        storage: storage,
                        color,
                        country: finalCountry,
                        sim,
                        activated,
                        connectivity: connectivity || undefined,
                        chip: chip || undefined,
                        displayFinish: displayFinish || undefined,
                    },
                });
                return { product: newProduct, price, rawNameForMatch, isNew: true };
            }
            // 7. Нашли существующий продукт
            (0, product_builder_1.addRawNameIfNeeded)(matchedProduct, rawNameForMatch);
            return {
                product: matchedProduct,
                price,
                rawNameForMatch,
                isNew: false,
            };
        }));
        const grouped = new Map();
        for (const item of chunkResults) {
            if (!item)
                continue;
            // 👇 ключ — товар в рамках ПРАЙСА, а не кеша
            const key = item.rawNameForMatch + "|" + item.product.id;
            const existing = grouped.get(key);
            if (!existing) {
                grouped.set(key, item);
                continue;
            }
            if (Number(item.price) < Number(existing.price)) {
                grouped.set(key, item);
            }
        }
        const valid = [...grouped.values()];
        result.push(...valid);
        unsavedCount += valid.length;
        if (unsavedCount >= constants_1.SAVE_EVERY_NUMBER_ITEMS) {
            (0, products_service_1.saveProductCache)();
            unsavedCount = 0;
        }
    }
    if (unknownBrands.size && options?.onUnknownBrand) {
        await options.onUnknownBrand([...unknownBrands]);
    }
    if (aiErrors.size && options?.onAiError) {
        await options.onAiError([...aiErrors]);
    }
    if (unresolvedItems.size && options?.onUnresolvedItems) {
        await options.onUnresolvedItems([...unresolvedItems]);
    }
    if (totalAICost > 0 && options?.onCostReport) {
        await options.onCostReport(totalAICost);
    }
    (0, products_service_1.saveProductCache)();
    return result;
}
