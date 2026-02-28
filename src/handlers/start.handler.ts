import TelegramBot from "node-telegram-bot-api";

import { ENV } from "../config/env";
import { adminKeyboard, mainKeyboard } from "../keyboards";
import { getUser, isAdmin } from "../services/users.service";
import { AUTH_TEXTS, getWelcomeText, START_TEXTS } from "../texts";
import { SECTION, START_ACTIONS } from "../types";
import { setChatState } from "../state/chat.state";
import { renderScreen } from "../render/renderScreen";

export function registerStart(bot: TelegramBot) {
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    if (!chatId) return;

    const now = Math.floor(Date.now() / 1000);
    if (msg.date < now - 5) return;

    const userName =
      msg.from?.username ||
      msg.from?.first_name ||
      "друг";

    setChatState(chatId, { mode: "idle" });

    const user = getUser(chatId);

    if (!user) {
      await renderScreen(bot, chatId, {
        section: SECTION.MAIN,
        text: AUTH_TEXTS.notActivated(chatId),
        inlineKeyboard: [
          [{ text: START_TEXTS.CHECK_ACCESS, callback_data: START_ACTIONS.CHECK_ACCESS }],
          [{ text: START_TEXTS.WRITE_MANAGER, url: ENV.MANAGER_URL }],
        ],
        parse_mode: "HTML",
      });
      return;
    }

    const welcomeText = getWelcomeText(userName, isAdmin(chatId));

    await bot.sendMessage(
      chatId,
      welcomeText,
      { reply_markup: mainKeyboard() }
    );

    await renderScreen(bot, chatId, {
      section: SECTION.MAIN,
      text: isAdmin(chatId) ? START_TEXTS.ADMIN_PANEL : START_TEXTS.SELECT_ACTION,
      inlineKeyboard: isAdmin(chatId) ? adminKeyboard() : [],
      parse_mode: "HTML",
    });
  });
}
