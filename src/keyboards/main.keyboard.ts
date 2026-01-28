// export const mainKeyboard = {
//   inline_keyboard: [
//     [{ text: "📊 Цены", callback_data: "prices" }],
//     [{ text: "ℹ️ О боте", callback_data: "about" }],
//   ],
// };

import { InlineKeyboardMarkup } from "node-telegram-bot-api";

export function mainKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: "📊 Цены",
          callback_data: "prices",
        },
      ],
      [
        {
          text: "ℹ️ О боте",
          callback_data: "about",
        },
      ],
    ],
  };
}

import { ReplyKeyboardMarkup, KeyboardButton } from "node-telegram-bot-api";

export function bottomKeyboard(): ReplyKeyboardMarkup {
  const pricesButton: KeyboardButton = { text: "📊 Цены" };
  const aboutButton: KeyboardButton = { text: "ℹ️ О боте" };

  return {
    keyboard: [
      [pricesButton],
      [aboutButton],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  };
}