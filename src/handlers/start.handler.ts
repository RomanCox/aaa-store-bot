import TelegramBot from "node-telegram-bot-api";

import { ENV } from "../config/env";
import { mainKeyboard, adminKeyboard } from "../keyboards";
import { getUser, isAdmin } from "../services/users.service";
import { AUTH_TEXTS } from "../texts/auth.texts";
import { START_TEXTS } from "../texts/start.texts";
import { START_ACTIONS } from "../types/actions";
import { setUserRole } from "../state/user.state";
import { getWelcomeText } from "../texts/welcome.texts";
import { setChatState } from "../state/chat.state";

export function registerStart(bot: TelegramBot) {
	bot.onText(/\/start/, async (msg) => {
		const chatId = msg.chat.id;
		const userId = msg.from?.id;
		const userName = msg.from?.username || msg.from?.first_name || "друг";

		if (!chatId || !userId) return;

		const user = getUser(userId);

		if (!user) {
			await bot.sendMessage(chatId,
				AUTH_TEXTS.notActivated(userId),
				{
					parse_mode: "HTML",
					reply_markup: {
						inline_keyboard: [
							[{text: START_TEXTS.CHECK_ACCESS, callback_data: START_ACTIONS.CHECK_ACCESS}],
							[{text: START_TEXTS.WRITE_MANAGER, url: ENV.MANAGER_URL}],
						],
					},
				}
			);
			return;
		}

		setUserRole(user.id, user.role);

		const now = Math.floor(Date.now() / 1000);
		if (msg.date < now - 5) return;

		const welcomeText = getWelcomeText(userName, isAdmin(userId));

		await bot.sendMessage(
			chatId,
			welcomeText,
			{ reply_markup: mainKeyboard() }
		);

		let navMsg

		if (isAdmin(userId)) {
			navMsg = await bot.sendMessage(chatId, START_TEXTS.ADMIN_PANEL, {
				reply_markup: adminKeyboard(),
			});
		} else {
			navMsg = await bot.sendMessage(chatId, START_TEXTS.SELECT_ACTION);
		}

		setChatState(chatId, {
      inlineMessageId: navMsg.message_id,
			section: undefined,
		});
	});
}
