"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeAnswerCallback = safeAnswerCallback;
async function safeAnswerCallback(bot, queryId, options) {
    try {
        await bot.answerCallbackQuery(queryId, {
            text: options?.text,
            show_alert: options?.show_alert ?? false,
        });
    }
    catch (err) {
        console.warn("⚠️ answerCallbackQuery failed", err?.response?.body || err?.message || err);
    }
}
