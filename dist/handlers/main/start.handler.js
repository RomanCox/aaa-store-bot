"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerStart = registerStart;
const env_1 = require("../../config/env");
const keyboards_1 = require("../../keyboards");
const users_service_1 = require("../../services/users.service");
const texts_1 = require("../../texts");
const texts_2 = require("../../texts");
const types_1 = require("../../types");
const texts_3 = require("../../texts");
const chat_state_1 = require("../../state/chat.state");
const renderAdminPanel_1 = require("./renderAdminPanel");
const types_2 = require("../../types");
const renderScreen_1 = require("../../render/renderScreen");
function registerStart(bot) {
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        const userName = msg.from?.username || msg.from?.first_name || "друг";
        if (!chatId)
            return;
        (0, chat_state_1.setChatState)(chatId, {
            section: types_2.SECTION.MAIN,
            currentMessageId: undefined,
        });
        const now = Math.floor(Date.now() / 1000);
        if (msg.date < now - 5)
            return;
        const user = (0, users_service_1.getUser)(chatId);
        if (!user) {
            await (0, renderScreen_1.renderScreen)(bot, chatId, texts_1.AUTH_TEXTS.notActivated(chatId), [
                [{ text: texts_2.START_TEXTS.CHECK_ACCESS, callback_data: types_1.START_ACTIONS.CHECK_ACCESS }],
                [{ text: texts_2.START_TEXTS.WRITE_MANAGER, url: env_1.ENV.MANAGER_URL }]
            ], "HTML");
            return;
        }
        const welcomeText = (0, texts_3.getWelcomeText)(userName, (0, users_service_1.isAdmin)(chatId));
        await bot.sendMessage(chatId, welcomeText, { reply_markup: (0, keyboards_1.mainKeyboard)() });
        await (0, renderAdminPanel_1.renderAdminPanel)(bot, chatId);
    });
}
