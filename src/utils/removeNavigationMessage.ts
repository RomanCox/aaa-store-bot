import TelegramBot from "node-telegram-bot-api";
import { getChatState, setChatState } from "../state/chat.state";

export async function removeNavigationMessage(
	bot: TelegramBot,
	chatId: number
) {
	const state = getChatState(chatId);
	const navMsgId = state?.navigationMessageId;

	if (!navMsgId) return;

	try {
		await bot.deleteMessage(chatId, navMsgId);
	} catch (err) {
		console.error(
			"❌ deleteMessage failed",
			navMsgId,
			err
		);
	}

	setChatState(chatId, {
		navigationMessageId: undefined,
	});
}
