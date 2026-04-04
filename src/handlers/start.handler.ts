import TelegramBot from "node-telegram-bot-api";

import { mainKeyboard } from "../keyboards";
import { getUser, isAdmin } from "../services/users.service";
import { getWelcomeText, START_TEXTS } from "../texts";
import { SECTION } from "../types";
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
      return;
    }

    const welcomeText = getWelcomeText(userName, isAdmin(chatId));

    await bot.sendMessage(
      chatId,
      welcomeText,
      { reply_markup: mainKeyboard(chatId) },
    );

    await renderScreen(bot, chatId, {
      section: SECTION.HOME,
      text: START_TEXTS.SELECT_ACTION,
      parse_mode: "HTML",
    });
  });
}
