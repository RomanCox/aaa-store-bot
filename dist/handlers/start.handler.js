"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerStart = registerStart;
const keyboards_1 = require("../keyboards");
const users_service_1 = require("../services/users.service");
const texts_1 = require("../texts");
const types_1 = require("../types");
const chat_state_1 = require("../state/chat.state");
const renderScreen_1 = require("../render/renderScreen");
function registerStart(bot) {
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        if (!chatId)
            return;
        const now = Math.floor(Date.now() / 1000);
        if (msg.date < now - 5)
            return;
        const userName = msg.from?.username ||
            msg.from?.first_name ||
            "друг";
        (0, chat_state_1.setChatState)(chatId, { mode: "idle" });
        const user = (0, users_service_1.getUser)(chatId);
        if (!user) {
            return;
        }
        const welcomeText = (0, texts_1.getWelcomeText)(userName, (0, users_service_1.isAdmin)(chatId));
        await bot.sendMessage(chatId, welcomeText, { reply_markup: (0, keyboards_1.mainKeyboard)(chatId) });
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: types_1.SECTION.HOME,
            text: texts_1.START_TEXTS.SELECT_ACTION,
            parse_mode: "HTML",
        });
    });
}
