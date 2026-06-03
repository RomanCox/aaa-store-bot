"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCatalogUIProducts = getCatalogUIProducts;
exports.getCatalogProductById = getCatalogProductById;
const utils_1 = require("../../../utils");
const catalog_builder_1 = require("../catalog.builder");
/**
 * UI ONLY: фильтрация + сортировка каталога для отображения
 * НЕ использовать в:
 * - отчетах
 * - CSV
 * - API
 * - бизнес-логике
 */
function getCatalogUIProducts(filters, role) {
    const allProducts = (0, catalog_builder_1.getCatalogProducts)({ role });
    const visibleProducts = allProducts.filter(p => !p.hidden);
    return sortProducts(visibleProducts.filter(p => {
        if (filters.brand && p.brand !== filters.brand)
            return false;
        if (filters.category && p.category !== filters.category)
            return false;
        if (filters.model && p.model !== filters.model)
            return false;
        if (filters.storage) {
            if (p.storage !== filters.storage)
                return false;
        }
        return true;
    }));
}
function sortProducts(products) {
    return [...products].sort((a, b) => {
        // 1. Бренд
        const brandCompare = (a.brand ?? "").localeCompare(b.brand ?? "", "ru", {
            sensitivity: "base",
        });
        if (brandCompare !== 0)
            return brandCompare;
        // 2. Категория
        const categoryCompare = (a.category ?? "").localeCompare(b.category ?? "", "ru", {
            sensitivity: "base",
        });
        if (categoryCompare !== 0)
            return categoryCompare;
        // 3. Модель (с поддержкой чисел)
        const nameCompare = (a.model ?? "").localeCompare(b.model ?? "", "ru", {
            numeric: true,
            sensitivity: "base",
        });
        if (nameCompare !== 0)
            return nameCompare;
        // 4. Память (если есть)
        const memA = (0, utils_1.extractMemorySubstring)(a.name ?? null);
        const memB = (0, utils_1.extractMemorySubstring)(b.name ?? null);
        const memCompare = (0, utils_1.compareSpecs)(memA, memB);
        if (memCompare !== 0)
            return memCompare;
        return (a.name ?? "").localeCompare(b.name ?? "", "ru", {
            numeric: true,
            sensitivity: "base",
        });
    });
}
function getCatalogProductById(id, role) {
    if (!id)
        return undefined;
    const all = (0, catalog_builder_1.getCatalogProducts)({ role });
    return all.find(p => p.id === id);
}
