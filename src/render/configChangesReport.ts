import TelegramBot from "node-telegram-bot-api";
import { PriceFormat, PriceRule } from "../types";
import { TELEGRAM_MESSAGE_LIMIT } from "../constants";
import { getPriceFormation } from "../services/price.service";
import { getBrandsConfig } from "../services/brands.service";
import { getColorsConfig } from "../services/colors.service";

// Снимок всего конфига из Google-таблицы: снимаем до и после "Обновить конфиг"
// и показываем админу только то, что реально поменялось.
export interface ConfigSnapshot {
  prices: PriceFormat[];
  brands: Record<string, string[]>;
  colors: Record<string, string[]>;
}

export function takeConfigSnapshot(): ConfigSnapshot {
  return {
    // Глубокая копия — чтобы снимок не зависел от дальнейших мутаций конфига.
    prices: JSON.parse(JSON.stringify(getPriceFormation() ?? [])),
    brands: getBrandsConfig(),
    colors: getColorsConfig(),
  };
}

const SEPARATOR = "━━━━━━━━━━━━━━━";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function changesCount(n: number): string {
  return n ? `<b>${n}</b> изм.` : "без изменений";
}

// ---------- Ценообразование ----------

// Тот же ключ, что и при парсинге листа "Ценообразование" (категория + бренд + ключевые слова).
function priceGroupKey(p: PriceFormat): string {
  return [p.category, p.brand, ...(p.keywords ?? [])].filter(Boolean).join("_");
}

function priceGroupTitle(p: PriceFormat): string {
  const parts = [p.category ?? "Все категории", p.brand ?? "Все бренды"];
  if (p.keywords?.length) {
    parts.push("🔑 " + p.keywords.join(", "));
  }
  return escapeHtml(parts.join(" · "));
}

type Tier = { max?: number; wholesale?: number; retail?: number };

// Правила группируем в "ступени" по порогу max: на одной ступени опт и розница.
function toTiers(rules: PriceRule[]): Map<string, Tier> {
  const tiers = new Map<string, Tier>();

  for (const rule of rules) {
    const key = rule.max === undefined ? "∞" : String(rule.max);
    const tier = tiers.get(key) ?? { max: rule.max };
    // Первое правило выигрывает — так же, как при поиске наценки.
    if (tier[rule.type] === undefined) tier[rule.type] = rule.value;
    tiers.set(key, tier);
  }

  return tiers;
}

function sortedTierKeys(...maps: Map<string, Tier>[]): string[] {
  const keys = new Set(maps.flatMap(m => Array.from(m.keys())));
  return Array.from(keys).sort((a, b) => {
    if (a === "∞") return 1;
    if (b === "∞") return -1;
    return Number(a) - Number(b);
  });
}

function tierLabel(tier: Tier): string {
  return tier.max === undefined ? "без лимита" : `до ${tier.max}`;
}

function percent(value?: number): string {
  return value === undefined ? "—" : `${value}%`;
}

function tierValues(tier: Tier): string {
  return `опт ${percent(tier.wholesale)} · розн ${percent(tier.retail)}`;
}

function changedValue(name: string, before?: number, after?: number): string | null {
  if (before === after) return null;
  return `${name} <s>${percent(before)}</s> → <b>${percent(after)}</b>`;
}

function diffPrices(before: PriceFormat[], after: PriceFormat[]): string[] {
  const beforeMap = new Map(before.map(p => [priceGroupKey(p), p]));
  const afterMap = new Map(after.map(p => [priceGroupKey(p), p]));
  const blocks: string[] = [];

  for (const [key, next] of afterMap) {
    const prev = beforeMap.get(key);
    const nextTiers = toTiers(next.prices);

    if (!prev) {
      const lines = sortedTierKeys(nextTiers).map(k => {
        const tier = nextTiers.get(k)!;
        return `   • ${tierLabel(tier)}:  ${tierValues(tier)}`;
      });
      blocks.push([`➕ <b>${priceGroupTitle(next)}</b>`, ...lines].join("\n"));
      continue;
    }

    const prevTiers = toTiers(prev.prices);
    const lines: string[] = [];

    for (const k of sortedTierKeys(prevTiers, nextTiers)) {
      const a = prevTiers.get(k);
      const b = nextTiers.get(k);

      if (!a && b) {
        lines.push(`   ➕ ${tierLabel(b)}:  ${tierValues(b)}`);
      } else if (a && !b) {
        lines.push(`   ➖ <s>${tierLabel(a)}:  ${tierValues(a)}</s>`);
      } else if (a && b) {
        const changes = [
          changedValue("опт", a.wholesale, b.wholesale),
          changedValue("розн", a.retail, b.retail),
        ].filter(Boolean);

        if (changes.length) {
          lines.push(`   ✏️ ${tierLabel(b)}:  ${changes.join(" · ")}`);
        }
      }
    }

    if (lines.length) {
      blocks.push([`✏️ <b>${priceGroupTitle(next)}</b>`, ...lines].join("\n"));
    }
  }

  for (const [key, prev] of beforeMap) {
    if (!afterMap.has(key)) {
      blocks.push(`➖ <s>${priceGroupTitle(prev)}</s>`);
    }
  }

  return blocks;
}

// ---------- Бренды / Цвета (название → ключевые слова) ----------

function keywordsList(keywords: string[]): string {
  return keywords.length ? escapeHtml(keywords.join(", ")) : "<i>нет ключевых слов</i>";
}

function diffKeywordsConfig(
  before: Record<string, string[]>,
  after: Record<string, string[]>,
  { trackOrder }: { trackOrder: boolean },
): string[] {
  const blocks: string[] = [];

  for (const [name, keywords] of Object.entries(after)) {
    const prev = before[name];

    if (!prev) {
      blocks.push(`➕ <b>${escapeHtml(name)}</b>\n   🔑 ${keywordsList(keywords)}`);
      continue;
    }

    const added = keywords.filter(k => !prev.includes(k));
    const removed = prev.filter(k => !keywords.includes(k));

    if (added.length || removed.length) {
      const lines = [`✏️ <b>${escapeHtml(name)}</b>`];
      if (added.length) lines.push(`   ➕ ${escapeHtml(added.join(", "))}`);
      if (removed.length) lines.push(`   ➖ <s>${escapeHtml(removed.join(", "))}</s>`);
      blocks.push(lines.join("\n"));
    }
  }

  for (const [name, keywords] of Object.entries(before)) {
    if (!(name in after)) {
      blocks.push(`➖ <s><b>${escapeHtml(name)}</b></s>\n   🔑 <s>${keywordsList(keywords)}</s>`);
    }
  }

  // Для брендов порядок важен: при определении бренда побеждает первое совпадение.
  if (trackOrder) {
    const prevOrder = Object.keys(before).filter(name => name in after);
    const nextOrder = Object.keys(after).filter(name => name in before);

    if (prevOrder.join("\n") !== nextOrder.join("\n")) {
      blocks.push(
        `🔀 <b>Изменён порядок</b>\n   ${escapeHtml(Object.keys(after).join(" → "))}`
      );
    }
  }

  return blocks;
}



// ---------- Сборка и отправка ----------

export function buildConfigChangesMessages(before: ConfigSnapshot, after: ConfigSnapshot): string[] {
  const sections = [
    { icon: "📊", title: "Ценообразование", blocks: diffPrices(before.prices, after.prices) },
    { icon: "🏷", title: "Бренды", blocks: diffKeywordsConfig(before.brands, after.brands, { trackOrder: true }) },
    { icon: "🎨", title: "Цвета", blocks: diffKeywordsConfig(before.colors, after.colors, { trackOrder: false }) },
  ];

  const totalChanges = sections.reduce((sum, s) => sum + s.blocks.length, 0);

  if (!totalChanges) {
    return ["🌀 <b>Конфиг обновлён</b>\n\n✅ Изменений нет — всё как было."];
  }

  const summary = sections
    .map(s => `${s.icon} ${s.title} — ${changesCount(s.blocks.length)}`)
    .join("\n");

  const blocks = [`🌀 <b>Конфиг обновлён</b>\n\n${summary}`];

  for (const s of sections) {
    if (!s.blocks.length) continue;
    blocks.push(`${SEPARATOR}\n${s.icon} <b>${s.title.toUpperCase()}</b>`, ...s.blocks);
  }

  // Режем по границам блоков, чтобы не разорвать HTML-теги между сообщениями.
  const messages: string[] = [];
  let current = "";

  for (const block of blocks) {
    const candidate = current ? `${current}\n\n${block}` : block;
    if (candidate.length > TELEGRAM_MESSAGE_LIMIT && current) {
      messages.push(current);
      current = block;
    } else {
      current = candidate;
    }
  }

  if (current) messages.push(current);

  return messages;
}

export async function sendConfigChangesReport(
  bot: TelegramBot,
  chatId: number,
  before: ConfigSnapshot,
  after: ConfigSnapshot,
) {
  for (const text of buildConfigChangesMessages(before, after)) {
    await bot.sendMessage(chatId, text, { parse_mode: "HTML" });
  }
}
