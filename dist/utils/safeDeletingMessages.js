"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeDelete = safeDelete;
async function safeDelete(bot, chatId, messageId) {
    if (!messageId)
        return;
    try {
        await bot.deleteMessage(chatId, messageId);
    }
    catch (err) {
        if (!err?.response?.body?.description?.includes("message to delete not found")) {
            console.error("Error deleting message:", messageId, err);
        }
    }
}
