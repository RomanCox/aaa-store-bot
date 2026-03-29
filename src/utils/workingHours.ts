import TelegramBot from "node-telegram-bot-api";
import { COMMON_TEXTS } from "../texts";
import { isAdmin } from "../services/users.service";

export function isWorkingHours(): boolean {
  const now = new Date();

  const minskTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Europe/Minsk" })
  );

  const hours = minskTime.getHours();

  // return hours >= 11 && hours < 21;
  return hours < 21;
}

export async function guardWorkingHours(
  bot: TelegramBot,
  chatId: number,
  action: () => void | Promise<void>
) {
  if (!isAdmin(chatId) && !isWorkingHours()) {
    await bot.sendMessage(chatId, COMMON_TEXTS.OUT_OF_WORK_MESSAGE);
    return;
  }

  return action();
}