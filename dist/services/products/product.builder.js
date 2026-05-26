"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalize = normalize;
exports.buildAAAStoreRawName = buildAAAStoreRawName;
exports.buildTodayThereTomorrowHereRawName = buildTodayThereTomorrowHereRawName;
exports.addRawNameIfNeeded = addRawNameIfNeeded;
exports.upsertProduct = upsertProduct;
const productId_1 = require("./productId");
const products_service_1 = require("./products.service");
function normalize(str) {
    return str
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/[\u00A0\u202F\u2009\u200A\u200B\uFEFF]/g, ' ')
        .trim();
}
function buildAAAStoreRawName(input) {
    let result = input.name.trim();
    if (input.sim) {
        result += ` (${input.sim})`;
    }
    if (input.country) {
        result += ` ${input.country}`;
    }
    return result;
}
function buildTodayThereTomorrowHereRawName(input) {
    let result = input.name;
    // 1. удалить флаги стран
    result = result.replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, "").trim();
    // 2. удалить старые sim пометки (в скобках)
    result = result.replace(/\([^)]*sim[^)]*\)/gi, "").trim();
    // 3. удалить (Active) (в любом регистре) – добавим позже в нужном месте
    result = result.replace(/\(active\)/gi, "").trim();
    // 4. собрать суффиксы в каноническом порядке: сначала SIM, затем Active
    const suffixes = [];
    if (input.sim)
        suffixes.push(`(${input.sim})`);
    if (input.activated === true)
        suffixes.push("(Active)");
    if (suffixes.length) {
        result += " " + suffixes.join(" ");
    }
    return result.replace(/\s+/g, " ").trim();
}
function addRawNameIfNeeded(product, raw) {
    const normalized = normalize(raw);
    const exists = product.rawNames.some(n => normalize(n) === normalized);
    if (!exists) {
        product.rawNames.push(raw);
    }
}
function upsertProduct(input) {
    const { rawName, brand, category, model, name, attributes } = input;
    const id = (0, productId_1.generateId)({
        brand,
        category,
        // rawName: rawName,
        model,
        storage: attributes?.storage,
        color: attributes?.color,
        country: attributes?.country,
        sim: attributes?.sim,
        connectivity: attributes?.connectivity,
        chip: attributes?.chip,
        activated: attributes?.activated,
        displayFinish: attributes?.displayFinish,
    });
    const existing = (0, products_service_1.getProductFromCacheById)(id);
    // 🔄 UPDATE
    if (existing) {
        const normalizedRaw = normalize(rawName);
        const exists = existing.rawNames.some(n => normalize(n) === normalizedRaw);
        if (!exists) {
            existing.rawNames.push(rawName);
        }
        return existing;
    }
    // ➕ CREATE
    const newProduct = {
        id,
        brand,
        model,
        category,
        name,
        attributes,
        rawNames: [rawName],
    };
    (0, products_service_1.setProductToCache)(id, newProduct);
    return newProduct;
}
