"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMessagesWithProducts = buildMessagesWithProducts;
exports.sanitizeTelegramText = sanitizeTelegramText;
const catalog_utils_1 = require("./catalog.utils");
const constants_1 = require("../constants");
function formatProductLine(product, userRole) {
    const name = product.name;
    const price = product.price;
    const currency = userRole === "retail" ? "р." : "";
    const country = product.country ?? "";
    const sim = product.sim ?? "";
    const active = product.activated ? "Active" : "";
    let line = `${name} - ${price}${currency}`;
    if (country) {
        line += ` ${sim}`;
    }
    if (sim) {
        line += ` 📲 ${sim}`; // или line += ` (${sim})`
    }
    if (active) {
        line += ` ✅ ${active}`;
    }
    return line;
}
function getProductGroupKey(product) {
    const brand = product.brand?.toLowerCase() ?? "";
    const category = product.category?.toLowerCase() ?? "";
    const model = product.model?.trim() ?? "";
    // === Samsung смартфоны → по первой букве модели ===
    if (brand === "samsung" && category === "смартфоны") {
        const firstLetter = model[0]?.toUpperCase();
        return firstLetter ?? null;
    }
    // === Apple смартфоны → по поколению iPhone ===
    if (brand === "apple" && category === "смартфоны") {
        const parts = model.split(/\s+/);
        // ожидаем ["iPhone", "16e", ...]
        if (parts.length >= 2) {
            const secondWord = parts[1];
            // 16e → 16
            const match = secondWord.match(/\d+/);
            if (match) {
                return match[0];
            }
        }
    }
    return null;
}
function shouldSplitMessage({ product, currentBrand, currentCategory, prevGroupKey, }) {
    const brand = product.brand ?? "";
    const category = product.category ?? "";
    // 1️⃣ Новый бренд или категория
    if (currentBrand !== brand || currentCategory !== category) {
        return true;
    }
    // 2️⃣ Проверка группировки внутри бренда
    const currentGroupKey = getProductGroupKey(product);
    return !!(prevGroupKey &&
        currentGroupKey &&
        prevGroupKey !== currentGroupKey);
}
function buildMessagesForProducts(products, userRole) {
    const messages = [];
    let currentMessage = "";
    let currentProducts = [];
    let currentBrand = null;
    let currentCategory = null;
    let prevModel = null;
    let prevStorage = null;
    let prevGroupKey = null;
    for (const product of products) {
        const brand = product.brand ?? "";
        const category = product.category ?? "";
        if (shouldSplitMessage({
            product,
            currentBrand,
            currentCategory,
            prevGroupKey,
        })) {
            if (currentMessage) {
                messages.push({ text: currentMessage, products: currentProducts });
            }
            currentMessage = "";
            currentProducts = [];
            currentBrand = brand;
            currentCategory = category;
            prevModel = null;
            prevStorage = null;
            prevGroupKey = null;
        }
        const model = product.model ?? "";
        const storage = (0, catalog_utils_1.extractMemorySubstring)(product.name ?? null);
        if (currentMessage) {
            const modelChanged = prevModel && model !== prevModel;
            const storageChanged = prevStorage && storage && (0, catalog_utils_1.compareSpecs)(prevStorage, storage) !== 0;
            if (modelChanged || storageChanged) {
                currentMessage += "\n";
            }
        }
        const line = formatProductLine(product, userRole);
        const safeLine = sanitizeTelegramText(line);
        if ((currentMessage + safeLine + "\n").length > constants_1.TELEGRAM_MESSAGE_LIMIT) {
            messages.push({ text: currentMessage, products: currentProducts });
            currentMessage = "";
            currentProducts = [];
            prevModel = null;
            prevStorage = null;
            prevGroupKey = null;
        }
        currentMessage += safeLine + "\n";
        currentProducts.push(product);
        const currentGroupKey = getProductGroupKey(product);
        if (currentGroupKey)
            prevGroupKey = currentGroupKey;
        prevModel = model;
        prevStorage = storage;
    }
    if (currentMessage) {
        messages.push({ text: currentMessage, products: currentProducts });
    }
    return messages;
}
function buildMessagesWithProducts(products, userRole) {
    // Разделяем товары на неактивированные и активированные
    const notActivated = products.filter(p => !p.activated);
    const activated = products.filter(p => p.activated === true);
    // Строим сообщения для неактивированных (со старой логикой)
    const notActivatedMessages = buildMessagesForProducts(notActivated, userRole);
    // Строим сообщения для активированных (с пустыми строками между моделями)
    const activatedMessages = buildMessagesForProducts(activated, userRole);
    // Объединяем: сначала неактивированные, потом активированные
    return [...notActivatedMessages, ...activatedMessages];
}
function sanitizeTelegramText(text) {
    return text
        .normalize('NFC') // приводим Unicode к нормальной форме
        .replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/g, '') // убираем control chars
        .replace(/\uFEFF/g, '') // BOM (часто из Excel)
        .replace(/([\u{1F1E6}-\u{1F1FF}])([\u{1F1E6}-\u{1F1FF}])/gu, (_, a, b) => a + b // гарантируем, что флаг — это пара символов
    );
}
