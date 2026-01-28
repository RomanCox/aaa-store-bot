import TelegramBot from "node-telegram-bot-api";

export function createBot() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is not defined");
  }

  return new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
    polling: true,
  });
}
