"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeCategory = normalizeCategory;
exports.getCategoryRu = getCategoryRu;
const category_1 = require("../constants/category");
function normalizeCategory(input) {
    return category_1.CATEGORY_REVERSE_MAP[input] ?? "unknown";
}
function getCategoryRu(key) {
    return category_1.CATEGORY_MAP[key] ?? category_1.CATEGORY_MAP.unknown;
}
