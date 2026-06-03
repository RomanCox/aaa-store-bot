"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderAdminPanel = renderAdminPanel;
const users_service_1 = require("../../services/users.service");
const texts_1 = require("../../texts");
const keyboards_1 = require("../../keyboards");
const renderScreen_1 = require("../../render/renderScreen");
async function renderAdminPanel(bot, chatId) {
    const text = (0, users_service_1.isAdmin)(chatId) ? texts_1.START_TEXTS.ADMIN_PANEL : texts_1.START_TEXTS.SELECT_ACTION;
    const inlineKeyboard = (0, users_service_1.isAdmin)(chatId) ? (0, keyboards_1.adminKeyboard)() : [];
    await (0, renderScreen_1.renderScreen)(bot, chatId, text, inlineKeyboard, "HTML");
}
