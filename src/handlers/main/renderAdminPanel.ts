import TelegramBot from "node-telegram-bot-api";
import { isAdmin } from "../../services/users.service";
import { START_TEXTS } from "../../texts";
import { adminKeyboard } from "../../keyboards";
import { renderScreen } from "../../render/renderScreen";

export async function renderAdminPanel(bot: TelegramBot, chatId: number) {
  const text = isAdmin(chatId) ? START_TEXTS.ADMIN_PANEL : START_TEXTS.SELECT_ACTION;
  const inlineKeyboard: TelegramBot.InlineKeyboardButton[][] = isAdmin(chatId) ? adminKeyboard() : [];

  await renderScreen(bot, chatId, text, inlineKeyboard, "HTML",);
}