import TelegramBot from "node-telegram-bot-api";

export async function createBot() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is not defined");
  }

	const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, {
		polling: false,
	});

	// Сначала снимаем webhook и сбрасываем накопившиеся апдейты, и только потом
	// стартуем polling — иначе poller успевает дёрнуть getUpdates раньше и
	// либо ловит конфликт 409, либо обрабатывает устаревшие апдейты.
	await (bot as any).deleteWebHook({ drop_pending_updates: true });

	await bot.startPolling();

	return bot;
}
