import TelegramBot from "node-telegram-bot-api";

export async function safeDelete(bot: TelegramBot, chatId: number, messageId?: number) {
  if (!messageId) return;
  try {
    await bot.deleteMessage(chatId, messageId);
  } catch (err: any) {
    if (!err?.response?.body?.description?.includes("message to delete not found")) {
      console.error("Error deleting message:", messageId, err);
    }
  }
}