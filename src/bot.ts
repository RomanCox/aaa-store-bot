import TelegramBot from "node-telegram-bot-api";

export async function createBot() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is not defined");
  }

	const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, {
		polling: true,
	});

	await (bot as any).deleteWebHook({ drop_pending_updates: true });

	return bot;
}
