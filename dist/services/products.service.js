"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tempExports = void 0;
exports.loadProducts = loadProducts;
exports.saveProducts = saveProducts;
exports.getProducts = getProducts;
exports.getProductById = getProductById;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("../utils");
const users_service_1 = require("./users.service");
const price_service_1 = require("./price.service");
const utils_2 = require("../utils");
const PRODUCTS_PATH = path_1.default.resolve(__dirname, "../data/products.json");
let products = new Map();
exports.tempExports = new Map();
function loadProducts() {
    if (!fs_1.default.existsSync(PRODUCTS_PATH))
        return;
    const raw = fs_1.default.readFileSync(PRODUCTS_PATH, "utf8");
    const list = (0, utils_2.sortProducts)(JSON.parse(raw));
    products.clear();
    for (const product of list) {
        products.set(product.id, product);
    }
}
function saveProducts(list) {
    fs_1.default.writeFileSync(PRODUCTS_PATH, JSON.stringify(list, null, 2), "utf-8");
    products.clear();
    for (const product of list) {
        products.set(product.id, product);
    }
}
function getProducts(chatId, filters = {}) {
    const userRole = (0, users_service_1.getUser)(chatId)?.role;
    const priceFormation = (0, price_service_1.getPriceFormation)();
    return Array.from(products.values())
        .filter(p => {
        if (filters.brand && p.brand !== filters.brand)
            return false;
        if (filters.category && p.category !== filters.category)
            return false;
        if (filters.model && p.model !== filters.model)
            return false;
        if (filters.storage) {
            if (!p.storage)
                return false;
            if (p.storage !== filters.storage)
                return false;
        }
        return true;
    })
        .map(product => ({
        ...product,
        price: (0, utils_1.priceFormat)(product.price, priceFormation, userRole),
    }));
}
function getProductById(chatId, id) {
    const userRole = (0, users_service_1.getUser)(chatId)?.role;
    const priceFormation = (0, price_service_1.getPriceFormation)();
    if (!id)
        return undefined;
    const product = products.get(id);
    if (!product)
        return undefined;
    return {
        ...product,
        price: (0, utils_1.priceFormat)(product.price, priceFormation, userRole),
    };
}
