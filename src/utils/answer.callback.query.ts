import TelegramBot from "node-telegram-bot-api";

export async function safeAnswerCallback(
  bot: TelegramBot,
  queryId: string,
  options?: { text?: string; show_alert?: boolean },
) {
	try {
		await bot.answerCallbackQuery(queryId, {
      text: options?.text,
      show_alert: options?.show_alert ?? false,
    });
	} catch (err: any) {
		console.warn(
			"⚠️ answerCallbackQuery failed",
			err?.response?.body || err?.message || err
		);
	}
}