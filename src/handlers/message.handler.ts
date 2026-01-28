import TelegramBot from "node-telegram-bot-api";

export function registerMessages(bot: TelegramBot) {
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) return;

    switch (text) {
      case "📊 Цены":
        await bot.sendMessage(chatId, "Ты нажал кнопку: 📊 Цены");
        break;

      case "ℹ️ О боте":
        await bot.sendMessage(
          chatId,
          "🤖 Это тестовый бот.\nДанные берутся из Google Sheets."
        );
        break;
    }
  });
}
