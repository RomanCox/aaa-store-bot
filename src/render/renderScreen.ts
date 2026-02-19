import TelegramBot from "node-telegram-bot-api";
import { getChatState, setChatState } from "../state/chat.state";

export async function renderScreen(
  bot: TelegramBot,
  chatId: number,
  text: string,
  inlineKeyboard: TelegramBot.InlineKeyboardButton[][] = [],
  parseType: TelegramBot.ParseMode = "HTML",
) {
  const state = getChatState(chatId);

  const replyMarkup: TelegramBot.InlineKeyboardMarkup = {
    inline_keyboard: inlineKeyboard,
  };

  if (state.currentMessageId) {
    try {
      await bot.editMessageText(text, {
        chat_id: chatId,
        message_id: state.currentMessageId,
        reply_markup: replyMarkup,
        parse_mode: parseType,
      });
      return;
    } catch (e) {
      state.currentMessageId = undefined;
    }
  }

  const message = await bot.sendMessage(chatId, text, {
    reply_markup: replyMarkup,
    parse_mode: parseType,
  });

  setChatState(chatId, {
    currentMessageId: message.message_id,
  });
}
