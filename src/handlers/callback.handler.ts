// import { bot } from "../bot";
//
// bot.on("callback_query", async (query) => {
//   const chatId = query.message?.chat.id;
//   const data = query.data;
//
//   if (!chatId || !data) return;
//
//   switch (data) {
//     case "prices":
//       await bot.sendMessage(chatId, "📊 Здесь будут цены");
//       break;
//
//     case "about":
//       await bot.sendMessage(chatId, "ℹ️ О боте");
//       break;
//   }
//
//   await bot.answerCallbackQuery(query.id);
// });

import TelegramBot from "node-telegram-bot-api";

export function registerCallbacks(bot: TelegramBot) {
  bot.on("callback_query", async (query) => {
    const chatId = query.message?.chat.id;
    if (!chatId || !query.data) return;

    switch (query.data) {
      case "prices":
        await bot.sendMessage(chatId, "Ты нажал кнопку: 📊 Цены");
        break;

      case "about":
        await bot.sendMessage(
          chatId,
          "🤖 Это тестовый бот.\nДанные берутся из Google Sheets."
        );
        break;

      default:
        await bot.sendMessage(chatId, "Неизвестная команда 🤷‍♂️");
    }

    // обязательно закрываем "часики" у кнопки
    await bot.answerCallbackQuery(query.id);
  });
}