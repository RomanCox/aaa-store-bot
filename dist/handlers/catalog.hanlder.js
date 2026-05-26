"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPriceList = sendPriceList;
exports.generateRetailCsv = generateRetailCsv;
const types_1 = require("../types");
const renderScreen_1 = require("../render/renderScreen");
const texts_1 = require("../texts");
const chat_state_1 = require("../state/chat.state");
const catalog_export_1 = require("../services/catalog/catalog.export");
const fs_1 = __importDefault(require("fs"));
const catalog_builder_1 = require("../services/catalog/catalog.builder");
const file_service_1 = require("../utils/file.service");
async function sendPriceList(bot, chatId, products) {
    if (!products.length) {
        await (0, renderScreen_1.renderScreen)(bot, chatId, { section: types_1.SECTION.CATALOG, text: texts_1.CATALOG_TEXTS.NOT_ITEMS_FOR_DOWNLOAD });
        return;
    }
    const state = (0, chat_state_1.getChatState)(chatId);
    const catalogState = (0, chat_state_1.getSectionState)(state, types_1.SECTION.CATALOG);
    const parts = ["price", catalogState?.selectedBrand, catalogState?.selectedCategory].filter(Boolean);
    const fileName = `${parts.join("_")}.xlsx`;
    const filePath = (0, catalog_export_1.generateProductsXlsx)(products, fileName);
    await bot.sendDocument(chatId, fs_1.default.createReadStream(filePath), {
        caption: texts_1.CATALOG_TEXTS.PRICE_LIST,
    }, {
        filename: fileName,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
}
function generateRetailCsv() {
    const products = (0, catalog_builder_1.getCatalogProducts)({ role: "retail" });
    const visibleProducts = products.filter(p => !p.hidden);
    const csv = (0, catalog_export_1.exportToCsv)(visibleProducts);
    (0, file_service_1.saveCsvToFile)(csv);
}
