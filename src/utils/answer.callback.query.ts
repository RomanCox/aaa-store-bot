import TelegramBot from "node-telegram-bot-api";

export async function safeAnswerCallback(bot: TelegramBot, queryId: string) {
	try {
		await bot.answerCallbackQuery(queryId);
	} catch (err: any) {
		console.warn(
			"⚠️ answerCallbackQuery failed",
			err?.response?.body || err?.message || err
		);
	}
}