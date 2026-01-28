// import { bot } from "../bot";
import TelegramBot from "node-telegram-bot-api";

import { bottomKeyboard, mainKeyboard } from "../keyboards/main.keyboard";
//
// bot.onText(/\/start/, async (msg) => {
//   await bot.sendMessage(msg.chat.id, "Выбери действие:", {
//     reply_markup: mainKeyboard,
//   });
// });

export function registerStart(bot: TelegramBot) {
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;

    // 1️⃣ Сообщение с inline-кнопками
    await bot.sendMessage(
      chatId,
      "👆 Вариант 1: кнопки в сообщении",
      {
        reply_markup: mainKeyboard(),
      }
    );

    // 2️⃣ Сообщение с кнопками снизу
    await bot.sendMessage(
      chatId,
      "👇 Вариант 2: кнопки внизу экрана",
      {
        reply_markup: bottomKeyboard(),
      }
    );
  });
}