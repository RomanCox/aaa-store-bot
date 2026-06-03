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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportToCsv = exportToCsv;
exports.generateProductsXlsx = generateProductsXlsx;
const types_1 = require("../../types");
const XLSX = __importStar(require("xlsx"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
function exportToCsv(products) {
    const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const keys = Object.keys(types_1.PRODUCT_XLSX_HEADERS);
    const header = keys.map(k => types_1.PRODUCT_XLSX_HEADERS[k]);
    const rows = products.map(p => keys.map(k => escape(p[k])));
    const csv = [
        header.join(","),
        ...rows.map(r => r.join(","))
    ].join("\n");
    return "\uFEFF" + csv;
}
function productsToXlsxData(products) {
    const headerRow = Object.values(types_1.PRODUCT_XLSX_HEADERS);
    const dataRows = products.map(product => Object.keys(types_1.PRODUCT_XLSX_HEADERS).map(key => {
        const value = product[key];
        return value ?? "";
    }));
    return [headerRow, ...dataRows];
}
function generateProductsXlsx(products, fileName = "price.xlsx") {
    const sheetData = productsToXlsxData(products);
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Прайс");
    const filePath = path_1.default.resolve("tmp", fileName);
    if (!fs_1.default.existsSync("tmp")) {
        fs_1.default.mkdirSync("tmp");
    }
    XLSX.writeFile(workbook, filePath);
    return filePath;
}
