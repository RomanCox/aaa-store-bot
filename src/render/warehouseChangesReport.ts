import TelegramBot from "node-telegram-bot-api";
import { TELEGRAM_MESSAGE_LIMIT } from "../constants";
import { getCatalog } from "../services/catalog/catalog.service";
import { getProductFromCacheById } from "../services/products/products.service";

export interface WarehouseSnapshotItem {
  productId: string;
  name: string;
  price: string;
}

// Показываем изменения именно попавших в каталог предложений, а не сравнение
// сырых строк таблицы. Ненайденные и некорректные строки идут отдельным отчётом.
export function takeWarehouseSnapshot(): WarehouseSnapshotItem[] {
  return getCatalog().flatMap(item => {
    const product = getProductFromCacheById(item.productId);
    if (!product) return [];
    const offer = item.offers.find(o => o.source === "warehouse");
    if (!offer) return [];
    const attrs = product.attributes;
    const name = [product.name, attrs?.sim, attrs?.country, attrs?.activated ? "(Active)" : undefined]
      .filter(Boolean).join(" ");
    return [{ productId: product.id, name, price: offer.price }];
  });
}

export function buildWarehouseChangesMessages(before: WarehouseSnapshotItem[], after: WarehouseSnapshotItem[]): string[] {
  const previous = new Map(before.map(item => [item.productId, item]));
  const next = new Map(after.map(item => [item.productId, item]));
  const lines: string[] = [];
  for (const item of after) {
    const old = previous.get(item.productId);
    if (!old) lines.push(`➕ ${item.name} — ${item.price} USD`);
    else if (Number(old.price) !== Number(item.price)) {
      lines.push(`✏️ ${item.name} — ${old.price} → ${item.price} USD`);
    }
  }
  for (const item of before) {
    if (!next.has(item.productId)) lines.push(`➖ ${item.name} — ${item.price} USD`);
  }
  if (!lines.length) return ["📦 Склад обновлён\n\n✅ Изменений нет."];

  const messages: string[] = [];
  let current = `📦 Склад обновлён\nИзменений: ${lines.length}\n\n`;
  for (const line of lines) {
    let rest = line + "\n";
    if (current && (current + rest).length > TELEGRAM_MESSAGE_LIMIT) {
      messages.push(current);
      current = "";
    }
    while (rest.length > TELEGRAM_MESSAGE_LIMIT) {
      // Не разрываем пару UTF-16 внутри эмодзи.
      let size = TELEGRAM_MESSAGE_LIMIT;
      if (/[\uD800-\uDBFF]/.test(rest[size - 1])) size--;
      messages.push(rest.slice(0, size));
      rest = rest.slice(size);
    }
    current += rest;
  }
  if (current) messages.push(current);
  return messages;
}

export async function sendWarehouseChangesReport(
  bot: TelegramBot, chatId: number, before: WarehouseSnapshotItem[], after: WarehouseSnapshotItem[],
) {
  for (const text of buildWarehouseChangesMessages(before, after)) {
    await bot.sendMessage(chatId, text);
  }
}
