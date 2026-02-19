import TelegramBot from "node-telegram-bot-api";

import { ENV } from "../../config/env";
import { mainKeyboard } from "../../keyboards";
import { getUser, isAdmin } from "../../services/users.service";
import { ADMIN_TEXTS, AUTH_TEXTS } from "../../texts";
import { START_TEXTS } from "../../texts";
import { START_ACTIONS } from "../../types";
import { getWelcomeText } from "../../texts";
import { setChatState } from "../../state/chat.state";
import { renderAdminPanel } from "./renderAdminPanel";
import { SECTION } from "../../types";
import { renderScreen } from "../../render/renderScreen";

export function registerStart(bot: TelegramBot) {
	bot.onText(/\/start/, async (msg) => {
		const chatId = msg.chat.id;
		const userName = msg.from?.username || msg.from?.first_name || "друг";

		if (!chatId) return;

    setChatState(chatId, {
      section: SECTION.MAIN,
      currentMessageId: undefined,
    });

		const now = Math.floor(Date.now() / 1000);
		if (msg.date < now - 5) return;

		const user = getUser(chatId);

		if (!user) {
      await renderScreen(
        bot,
        chatId,
        AUTH_TEXTS.notActivated(chatId),
        [
          [{text: START_TEXTS.CHECK_ACCESS, callback_data: START_ACTIONS.CHECK_ACCESS}],
          [{text: START_TEXTS.WRITE_MANAGER, url: ENV.MANAGER_URL}]
        ],
        "HTML"
      );
			return;
		}

		const welcomeText = getWelcomeText(userName, isAdmin(chatId));

		await bot.sendMessage(
			chatId,
			welcomeText,
			{ reply_markup: mainKeyboard() }
		);

    await renderAdminPanel(bot, chatId);
	});
}
