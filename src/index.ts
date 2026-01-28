import "dotenv/config";

import { createBot } from "./bot";
import { registerStart } from "./handlers/start.handler";
import { registerCallbacks } from "./handlers/callback.handler";
import { registerMessages } from "./handlers/message.handler";
// import { getSheet } from "./services/sheets.service";

const bot = createBot();

registerStart(bot);
registerCallbacks(bot);
registerMessages(bot);


console.log("🤖 Bot started");

// bot.onText(/\/start/, async (msg) => {
// 	// bot.sendMessage(msg.chat.id, "pnpm + Google Sheets + Telegram 🚀");
//
//   await bot.sendMessage(
//     msg.chat.id,
//     "Привет! Выбери действие 👇",
//     {
//       reply_markup: {
//         keyboard: [
//           [{ text: "Ты нажал на кнопку: 📊 Цены" }]
//         ],
//         resize_keyboard: true,
//         one_time_keyboard: false,
//       },
//     }
//   );
//
//   const chatId = msg.chat.id;
//
//   await bot.sendMessage(chatId, "Привет! 👋\nВыбери действие:", {
//     reply_markup: {
//       inline_keyboard: [
//         [
//           {
//             text: "📊 Цены",
//             callback_data: "prices",
//           },
//         ],
//         [
//           {
//             text: "ℹ️ О боте",
//             callback_data: "about",
//           },
//         ],
//       ],
//     },
//   });
// });
//
// bot.onText(/\/data/, async (msg) => {
// 	const rows = await getSheet("Товары!A2:B10");
//
// 	const text = rows.length
// 		? rows.map(r => r.join(" — ")).join("\n")
// 		: "Данных нет";
//
// 	bot.sendMessage(msg.chat.id, text);
// });
