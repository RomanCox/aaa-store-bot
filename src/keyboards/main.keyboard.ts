// import { InlineKeyboardMarkup } from "node-telegram-bot-api";
//
// export function mainKeyboard(): InlineKeyboardMarkup {
//   return {
//     inline_keyboard: [
//       [
//         {
//           text: "📊 Цены",
//           callback_data: "prices",
//         },
//       ],
//       [
//         {
//           text: "ℹ️ О боте",
//           callback_data: "about",
//         },
//       ],
//     ],
//   };
// }

import { ReplyKeyboardMarkup, KeyboardButton } from "node-telegram-bot-api";
import {MenuButtons} from "../constants/menu-buttons";

export function mainKeyboard(): ReplyKeyboardMarkup {
  const pricesButton: KeyboardButton = { text: MenuButtons.Prices };
  const ordersButton: KeyboardButton = { text: "📋 Заказы" };
  const cartButton: KeyboardButton = { text: "🛒 Корзина" };
  const balanceButton: KeyboardButton = { text: "💰 Баланс" };
  const managerButton: KeyboardButton = { text: "✍️ Менеджер" };
  const settingsButton: KeyboardButton = { text: "⚙️ Настройки" };

  return {
    keyboard: [
      [pricesButton, ordersButton, cartButton],
      [balanceButton, managerButton, settingsButton],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  };
}