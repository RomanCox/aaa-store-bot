"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeNavigationMessage = removeNavigationMessage;
const chat_state_1 = require("../state/chat.state");
async function removeNavigationMessage(bot, chatId) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const navMsgId = state?.inlineMessageId;
    if (!navMsgId)
        return;
    try {
        await bot.deleteMessage(chatId, navMsgId);
    }
    catch (err) {
        console.error("❌ deleteMessage failed", navMsgId, err);
    }
    (0, chat_state_1.setChatState)(chatId, {
        inlineMessageId: undefined,
    });
}
