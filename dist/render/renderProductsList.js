"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderProductsList = renderProductsList;
const utils_1 = require("../utils");
const types_1 = require("../types");
const texts_1 = require("../texts");
const chat_state_1 = require("../state/chat.state");
const renderScreen_1 = require("./renderScreen");
const users_service_1 = require("../services/users.service");
const catalog_ui_1 = require("../services/catalog/ui/catalog.ui");
async function renderProductsList(bot, chatId) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const catalogState = (0, chat_state_1.getSectionState)(state, types_1.SECTION.CATALOG);
    if (!catalogState)
        return;
    const { selectedBrand, selectedCategory } = catalogState;
    const filter = {
        brand: selectedBrand,
        category: selectedCategory,
    };
    const role = (0, users_service_1.getUserRole)(chatId);
    const products = (0, catalog_ui_1.getCatalogUIProducts)(filter, role);
    if (!products.length) {
        (0, chat_state_1.setChatState)(chatId, {
            mode: "error",
        });
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: types_1.SECTION.CATALOG,
            text: texts_1.CATALOG_TEXTS.UNAVAILABLE,
            withBackButton: true,
        });
        return;
    }
    const userRole = (0, users_service_1.getUserRole)(chatId);
    const parts = (0, utils_1.buildMessagesWithProducts)(products, userRole);
    // сохраняем lastProductGroups в sections
    (0, chat_state_1.setChatState)(chatId, {
        sections: {
            ...state.sections,
            [types_1.SECTION.CATALOG]: {
                ...catalogState,
                flowStep: "products",
                lastProductGroups: parts.map(p => p.products),
            },
        },
    });
    for (const part of parts) {
        const filters = {
            brand: selectedBrand,
            category: selectedCategory,
        };
        const downloadKey = (0, utils_1.buildDownloadCallback)(filters);
        // создаём новое сообщение для каждого блока продуктов (keepOldMessage)
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: types_1.SECTION.CATALOG,
            text: part.text,
            inlineKeyboard: [[{
                        text: texts_1.CATALOG_TEXTS.DOWNLOAD_CATALOG,
                        callback_data: (0, utils_1.buildCallbackData)(types_1.CALLBACK_TYPE.DOWNLOAD_XLSX, downloadKey),
                    }]],
        });
    }
}
