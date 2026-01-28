import TelegramBot from "node-telegram-bot-api";

import { mainKeyboard } from "../keyboards/main.keyboard";

export function registerStart(bot: TelegramBot) {
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;

		const now = Math.floor(Date.now() / 1000);
		if (msg.date < now - 5) return;

    await bot.sendMessage(
      chatId,
      "Привет! Выбери действие:",
      {
        reply_markup: mainKeyboard(),
      }
    );
  });
}
