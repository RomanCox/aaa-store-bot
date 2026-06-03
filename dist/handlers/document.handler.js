"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDocumentHandler = registerDocumentHandler;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const xlsx_service_1 = require("../services/xlsx.service");
const users_service_1 = require("../services/users.service");
const chat_state_1 = require("../state/chat.state");
const texts_1 = require("../texts");
const renderScreen_1 = require("../render/renderScreen");
const types_1 = require("../types");
const keyboards_1 = require("../keyboards");
const utils_1 = require("../utils");
const reports_1 = require("../render/reports");
const catalog_service_1 = require("../services/catalog/catalog.service");
const catalog_builder_1 = require("../services/catalog/catalog.builder");
const catalog_hanlder_1 = require("./catalog.hanlder");
async function handleIngestResult(bot, chatId, items, source) {
    if (!items.length) {
        await bot.sendMessage(chatId, texts_1.ADMIN_TEXTS.ERROR_ITEMS);
        return;
    }
    (0, catalog_service_1.clearCatalogSource)(source);
    for (const item of items) {
        (0, catalog_service_1.upsertCatalog)(item.product.id, item.price, source);
    }
    (0, catalog_service_1.saveCatalog)();
    const result = (0, catalog_builder_1.getCatalogProducts)();
    await (0, reports_1.sendHiddenProductsReport)(bot, result);
    const newItemsCount = items.filter(i => i.isNew).length;
    await bot.sendMessage(chatId, `${texts_1.ADMIN_TEXTS.PRICE_UPLOAD_SUCCESS + items.length + texts_1.ADMIN_TEXTS.PRICE_UPLOAD_NEW_ITEMS + newItemsCount}`);
    (0, catalog_hanlder_1.generateRetailCsv)();
}
function registerDocumentHandler(bot) {
    bot.on("document", async (query) => {
        if (!query.from)
            return;
        const userId = query.from.id;
        const chatId = query.chat.id;
        const state = (0, chat_state_1.getChatState)(userId);
        if (!(0, users_service_1.isAdmin)(chatId))
            return;
        if (state.mode !== "upload_xlsx") {
            await (0, renderScreen_1.renderScreen)(bot, query.chat.id, { section: types_1.SECTION.ADMIN_PANEL, text: texts_1.ADMIN_TEXTS.DONT_WAITING_FILE });
            return;
        }
        const flowStep = state.sections.admin_panel?.flowStep;
        const document = query.document;
        if (!document) {
            await (0, renderScreen_1.renderScreen)(bot, query.chat.id, { section: types_1.SECTION.ADMIN_PANEL, text: texts_1.ADMIN_TEXTS.CANT_FIND_FILE });
            return;
        }
        try {
            const tmpDir = path_1.default.resolve("tmp");
            if (!fs_1.default.existsSync(tmpDir))
                fs_1.default.mkdirSync(tmpDir);
            const filePath = await bot.downloadFile(document.file_id, tmpDir);
            const buffer = fs_1.default.readFileSync(filePath);
            if (flowStep === "upload_aaa_store_price") {
                const items = await (0, xlsx_service_1.ingestAAAStorePrice)(buffer, {
                    onUnknownBrand: async (names) => {
                        await (0, reports_1.sendUnknownBrandsReport)(bot, names);
                    },
                    onAiError: async (names) => {
                        await (0, reports_1.onAiError)(bot, names);
                    },
                    onUnresolvedItems: async (names) => {
                        await (0, reports_1.onUnresolvedItems)(bot, names);
                    },
                    onCostReport: async (totalCost) => {
                        await (0, reports_1.onCostReport)(bot, totalCost);
                    },
                });
                await handleIngestResult(bot, chatId, items, "AAA-store");
            }
            if (flowStep === "upload_today_there_tomorrow_here_price") {
                const items = await (0, xlsx_service_1.ingestTodayThereTomorrowHerePrice)(buffer, {
                    onUnknownBrand: async (names) => {
                        await (0, reports_1.sendUnknownBrandsReport)(bot, names);
                    },
                    onAiError: async (names) => {
                        await (0, reports_1.onAiError)(bot, names);
                    },
                    onUnresolvedItems: async (names) => {
                        await (0, reports_1.onUnresolvedItems)(bot, names);
                    },
                    onCostReport: async (totalCost) => {
                        await (0, reports_1.onCostReport)(bot, totalCost);
                    },
                });
                await handleIngestResult(bot, chatId, items, "Today there tomorrow here");
            }
            const state = (0, chat_state_1.getChatState)(userId);
            const adminState = state.sections[types_1.SECTION.ADMIN_PANEL];
            if (adminState?.messageId) {
                await (0, utils_1.safeDelete)(bot, adminState.messageId);
            }
            (0, chat_state_1.updateSectionState)(userId, types_1.SECTION.ADMIN_PANEL, (prev) => ({
                ...prev,
                messageId: undefined,
            }));
            await (0, renderScreen_1.renderScreen)(bot, chatId, {
                section: types_1.SECTION.ADMIN_PANEL,
                text: texts_1.START_TEXTS.ADMIN_PANEL,
                inlineKeyboard: (0, keyboards_1.adminKeyboard)(),
                parse_mode: "HTML",
            });
            (0, chat_state_1.setChatState)(userId, { mode: "idle" });
        }
        catch (error) {
            console.log(error);
            await bot.sendMessage(chatId, texts_1.ADMIN_TEXTS.FILE_ERROR);
            await (0, renderScreen_1.renderScreen)(bot, chatId, {
                section: types_1.SECTION.ADMIN_PANEL,
                text: texts_1.START_TEXTS.ADMIN_PANEL,
                inlineKeyboard: (0, keyboards_1.adminKeyboard)(),
                parse_mode: "HTML",
            });
        }
    });
}
