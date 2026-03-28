import TelegramBot from "node-telegram-bot-api";
import { ProductForCatalog } from "../types";
import { ADMIN_TEXTS } from "../texts";
import { TELEGRAM_MESSAGE_LIMIT } from "../constants";
import { keyWordsFromConfig, resolveBrandFromName } from "../services/brands.service";

export async function sendHiddenProductsReport(
  bot: TelegramBot,
  chatId: number,
  products: ProductForCatalog[]
) {
  const hiddenProducts = products.filter(p => p.hidden);

  if (!hiddenProducts.length) return;

  const header =
    ADMIN_TEXTS.ITEMS_WITHOUT_MARKUP +
    hiddenProducts.length +
    "\n\n";

  const lines = hiddenProducts.map(
    p => `• ${p.category} | ${p.name} — ${p.price} RUB`
  );

  let message = header;

  for (const line of lines) {
    if ((message + line + "\n").length > TELEGRAM_MESSAGE_LIMIT) {
      await bot.sendMessage(chatId, message);
      message = "";
    }
    message += line + "\n";
  }

  if (message) {
    await bot.sendMessage(chatId, message);
  }

  const unresolvedBrandProducts = hiddenProducts.filter(
    p => !resolveBrandFromName(p.name)
  );

  if (unresolvedBrandProducts.length > 0) {
    const unresolvedHeader =
      ADMIN_TEXTS.ITEMS_WITH_UNKNOWN_BRAND +
      unresolvedBrandProducts.length +
      "\n\n";

    const unresolvedLines = unresolvedBrandProducts.map(
      p => `• ${p.category} | ${p.name} — ${p.price} RUB`
    );

    let unresolvedMessage = unresolvedHeader;

    for (const line of unresolvedLines) {
      if ((unresolvedMessage + line + "\n").length > TELEGRAM_MESSAGE_LIMIT) {
        await bot.sendMessage(chatId, unresolvedMessage);
        unresolvedMessage = "";
      }
      unresolvedMessage += line + "\n";
    }

    if (unresolvedMessage) {
      await bot.sendMessage(chatId, unresolvedMessage);
    }
  }
}