"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadCatalogHelpers = downloadCatalogHelpers;
exports.serializeFilters = serializeFilters;
exports.buildDownloadCallback = buildDownloadCallback;
const types_1 = require("../types");
const callbackBuilder_1 = require("./callbackBuilder");
function downloadCatalogHelpers(parts) {
    const filters = {};
    for (const part of parts) {
        const [key, value] = part.split('=');
        if (key === 'brand')
            filters.brand = value;
        if (key === 'category')
            filters.category = value;
        if (key === 'model')
            filters.model = value;
        if (key === 'storage')
            filters.storage = value;
    }
    return filters;
}
function serializeFilters(filters) {
    const parts = [];
    if (filters.brand)
        parts.push(`b=${filters.brand}`);
    if (filters.category)
        parts.push(`c=${filters.category}`);
    if (filters.model)
        parts.push(`m=${filters.model}`);
    if (filters.storage)
        parts.push(`s=${filters.storage}`);
    if (!parts.length) {
        parts.push('all=true');
    }
    return parts;
}
function buildDownloadCallback(filters) {
    return (0, callbackBuilder_1.buildCallbackData)(types_1.CALLBACK_TYPE.DOWNLOAD_XLSX, ...serializeFilters(filters));
}
