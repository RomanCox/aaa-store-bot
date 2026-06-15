import TelegramBot from "node-telegram-bot-api";
import { LowConfidenceItem, ProductForUI } from "../types";
import { ADMIN_TEXTS } from "../texts";
import { TELEGRAM_MESSAGE_LIMIT } from "../constants";
import { resolveBrandFromName } from "../services/brands.service";

const ADMIN_ID = Number(process.env.ADMIN_ID);

export async function sendUnknownProductsReport(
  bot: TelegramBot,
  products: { name: string }[]
) {
  if (!products.length || !ADMIN_ID) return;

  const preview = products
    .slice(0, 20)
    .map((p, i) => `${i + 1}. ${p.name}`)
    .join("\n");

  const text =
    `⚠️ <b>Не удалось определить модель</b>\n\n` +
    `Количество: <b>${products.length}</b>\n\n` +
    preview +
    (products.length > 20 ? `\n\n...и ещё ${products.length - 20}` : "");

  await bot.sendMessage(ADMIN_ID, text, {
    parse_mode: "HTML",
  });
}

export async function sendHiddenProductsReport(bot: TelegramBot, products: ProductForUI[]) {
  const hiddenProducts = products.filter(p => p.hidden);

  if (!hiddenProducts.length) return;

  const header =
    ADMIN_TEXTS.ITEMS_WITHOUT_MARKUP +
    hiddenProducts.length +
    "\n\n";

  const lines = hiddenProducts.map(
    p => {
      const currency = p.source === "AAA-store"
        ? "RUB"
        : p.source === "Today there tomorrow here"
          ? "USD"
          : "*"
      return `• ${p.category} | ${p.name} — ${p.price} ${currency}`
    }
  );

  let message = header;

  for (const line of lines) {
    if ((message + line + "\n").length > TELEGRAM_MESSAGE_LIMIT) {
      await bot.sendMessage(ADMIN_ID, message);
      message = "";
    }
    message += line + "\n";
  }

  if (message) {
    await bot.sendMessage(ADMIN_ID, message);
  }

  const unresolvedBrandProducts = products.filter(
    p => !resolveBrandFromName(p.name)
  );

  if (unresolvedBrandProducts.length > 0) {
    const unresolvedHeader =
      ADMIN_TEXTS.ITEMS_WITH_UNKNOWN_BRAND +
      unresolvedBrandProducts.length +
      "\n\n";

    const unresolvedLines = unresolvedBrandProducts.map(
      p => {
        const currency = p.source === "AAA-store"
          ? "RUB"
          : p.source === "Today there tomorrow here"
            ? "USD"
            : "*"
        return `• ${p.category} | ${p.name} — ${p.price} ${currency}`
      }
    );

    let unresolvedMessage = unresolvedHeader;

    for (const line of unresolvedLines) {
      if ((unresolvedMessage + line + "\n").length > TELEGRAM_MESSAGE_LIMIT) {
        await bot.sendMessage(ADMIN_ID, unresolvedMessage);
        unresolvedMessage = "";
      }
      unresolvedMessage += line + "\n";
    }

    if (unresolvedMessage) {
      await bot.sendMessage(ADMIN_ID, unresolvedMessage);
    }
  }
}

export async function sendUnknownBrandsReport(bot: TelegramBot, names: string[]) {
  if (!names.length) return;

  const unique = [...new Set(names)];

  const header =
    ADMIN_TEXTS.ITEMS_WITH_UNKNOWN_BRAND +
    unique.length +
    "\n\n";

  let message = header;

  for (const name of unique) {
    const line = `• ${name}`;

    if ((message + line + "\n").length > TELEGRAM_MESSAGE_LIMIT) {
      await bot.sendMessage(ADMIN_ID, message);
      message = "";
    }

    message += line + "\n";
  }

  if (message) {
    await bot.sendMessage(ADMIN_ID, message);
  }
}

export async function onAiError(bot: TelegramBot, names: string[]) {
  if (!names.length) return;

  let message = `${ADMIN_TEXTS.AI_ERROR} (${names.length})\n\n`;

  for (const name of names) {
    const line = `• ${name}\n`;

    if ((message + line).length > TELEGRAM_MESSAGE_LIMIT) {
      await bot.sendMessage(ADMIN_ID, message);
      message = "";
    }

    message += line;
  }

  if (message) {
    await bot.sendMessage(ADMIN_ID, message);
  }
}

export async function onUnresolvedItems(bot: TelegramBot, names: string[]) {
  if (!names.length) return;

  let message = `${ADMIN_TEXTS.DONT_RECOGNIZED} (${names.length})\n\n`;

  for (const name of names) {
    const line = `• ${name}\n`;

    if ((message + line).length > TELEGRAM_MESSAGE_LIMIT) {
      await bot.sendMessage(ADMIN_ID, message);
      message = "";
    }

    message += line;
  }

  if (message) {
    await bot.sendMessage(ADMIN_ID, message);
  }
}

export async function onCostReport(bot: TelegramBot, totalCost: number) {
  await bot.sendMessage(ADMIN_ID, `${ADMIN_TEXTS.AI_COST}${totalCost.toFixed(4)}`);
}

export async function onLowConfidenceItems(
  bot: TelegramBot,
  items: LowConfidenceItem[]
) {
  if (!items.length) return;

  let message = `⚠️ LOW CONFIDENCE (${items.length})\n\n`;

  for (const item of items) {
    const line =
      `• ${item.name}\n` +
      `  brand: ${item.brand} | cat: ${item.category} | conf: ${item.confidence}\n\n`;

    if ((message + line).length > TELEGRAM_MESSAGE_LIMIT) {
      await bot.sendMessage(ADMIN_ID, message);
      message = "";
    }

    message += line;
  }

  if (message) {
    await bot.sendMessage(ADMIN_ID, message);
  }
}