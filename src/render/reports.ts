import TelegramBot from "node-telegram-bot-api";
import {CachedProduct, IngestSkippedGroup, LowConfidenceItem, ProductForUI} from "../types";
import {ADMIN_TEXTS} from "../texts";
import {TELEGRAM_MESSAGE_LIMIT} from "../constants";
import {resolveBrandFromName} from "../services/brands.service";

const ADMIN_ID = Number(process.env.ADMIN_ID);

export async function sendIngestSkippedReport(
  bot: TelegramBot,
  chatId: number,
  groups: IngestSkippedGroup[],
) {
  for (const group of groups) {
    let message = `⚠️ ${group.title}: ${group.names.length}\n\n`;
    for (const name of group.names) {
      const line = `• ${name}\n`;
      if (message && (message + line).length > TELEGRAM_MESSAGE_LIMIT) {
        await bot.sendMessage(chatId, message);
        message = "";
      }
      // Даже одиночное очень длинное название не превышает лимит сообщения.
      for (let offset = 0; offset < line.length; offset += TELEGRAM_MESSAGE_LIMIT) {
        const part = line.slice(offset, offset + TELEGRAM_MESSAGE_LIMIT);
        if (part.length === TELEGRAM_MESSAGE_LIMIT) await bot.sendMessage(chatId, part);
        else message += part;
      }
    }
    if (message) await bot.sendMessage(chatId, message);
  }
}

// По кнопке в админ-панели — список товаров, у которых rawNames подозрительно много
// (в норме 1-2, одно и то же название с разных прайсов). Много rawNames обычно значит,
// что под одним id по ошибке схлопнулось несколько разных физических товаров.
// В отличие от остальных отчётов шлём не на фиксированный ADMIN_ID, а тому, кто нажал кнопку.
export async function sendRawNamesReport(
  bot: TelegramBot,
  chatId: number,
  products: CachedProduct[],
  minRawNames: number,
) {
  if (!products.length) {
    await bot.sendMessage(
      chatId,
      `✅ Товаров с rawNames > ${minRawNames} не найдено.`
    );
    return;
  }

  let message = `🔍 Товаров с rawNames > ${minRawNames}: ${products.length}\n`;

  for (const p of products) {
    const lines = [
      `\n[${p.category}] ${p.brand} ${p.model} — ${p.name} (${p.id})`,
      `rawNames (${p.rawNames.length}):`,
      ...p.rawNames.map(raw => `  • ${raw}`),
    ];
    const block = lines.join("\n") + "\n";

    if ((message + block).length > TELEGRAM_MESSAGE_LIMIT) {
      await bot.sendMessage(chatId, message);
      message = "";
    }
    message += block;
  }

  if (message) {
    await bot.sendMessage(chatId, message);
  }
}

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
        : p.source === "Today there tomorrow here" || p.source === "warehouse"
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
          : p.source === "Today there tomorrow here" || p.source === "warehouse"
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

  let message = ADMIN_TEXTS.ITEMS_WITH_UNKNOWN_BRAND +
      unique.length +
      "\n\n";

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

async function sendNamesReport(bot: TelegramBot, names: string[], title: string) {
  if (!names.length) return;

  let message = ADMIN_TEXTS.COUNTED_REPORT_HEADER(title, names.length);

  for (const name of names) {
    const line = ADMIN_TEXTS.REPORT_NAME_LINE(name);

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

export async function onAiError(bot: TelegramBot, names: string[]) {
  await sendNamesReport(bot, names, ADMIN_TEXTS.AI_ERROR);
}

export async function onUnresolvedItems(bot: TelegramBot, names: string[]) {
  await sendNamesReport(bot, names, ADMIN_TEXTS.DONT_RECOGNIZED);
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
