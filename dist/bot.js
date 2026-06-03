"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBot = createBot;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
async function createBot() {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
        throw new Error("TELEGRAM_BOT_TOKEN is not defined");
    }
    const bot = new node_telegram_bot_api_1.default(process.env.TELEGRAM_BOT_TOKEN, {
        polling: true,
    });
    await bot.deleteWebHook({ drop_pending_updates: true });
    return bot;
}
