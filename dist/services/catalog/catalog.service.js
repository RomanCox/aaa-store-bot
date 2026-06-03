"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadCatalog = loadCatalog;
exports.saveCatalog = saveCatalog;
exports.clearCatalogSource = clearCatalogSource;
exports.upsertCatalog = upsertCatalog;
exports.getCatalog = getCatalog;
exports.getCatalogItem = getCatalogItem;
const fs_1 = __importDefault(require("fs"));
const CATALOG_PATH = "./data/catalog.json";
let catalog = new Map();
// ---------------- LOAD/SAVE ----------------
function loadCatalog() {
    if (!fs_1.default.existsSync(CATALOG_PATH))
        return;
    const raw = fs_1.default.readFileSync(CATALOG_PATH, "utf8");
    const list = JSON.parse(raw);
    catalog.clear();
    for (const item of list) {
        catalog.set(item.productId, item);
    }
}
function saveCatalog() {
    const list = Array.from(catalog.values());
    fs_1.default.writeFileSync(CATALOG_PATH, JSON.stringify(list, null, 2), "utf-8");
}
// ---------------- CLEAR PRICES ----------------
function clearCatalogSource(source) {
    for (const [id, item] of catalog.entries()) {
        item.offers = item.offers.filter(o => o.source !== source);
        // если офферов больше нет — удаляем товар
        if (item.offers.length === 0) {
            catalog.delete(id);
        }
    }
}
// ---------------- UPSERT ----------------
function upsertCatalog(productId, price, source) {
    const existing = catalog.get(productId);
    if (existing) {
        if (!existing.offers) {
            existing.offers = [];
        }
        const existingOffer = existing.offers.find(o => o.source === source);
        if (existingOffer) {
            existingOffer.price = price;
        }
        else {
            existing.offers.push({ price, source });
        }
    }
    else {
        catalog.set(productId, {
            productId,
            offers: [{ price, source }],
        });
    }
}
// ---------------- GET ----------------
function getCatalog() {
    return Array.from(catalog.values());
}
function getCatalogItem(productId) {
    return catalog.get(productId);
}
