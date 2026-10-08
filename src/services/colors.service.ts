import fs from "fs";
import { COLORS_PATH } from "../constants";
import { writeJsonFileAtomic } from "../utils";

// Правило таблицы "Цвета": каноническое имя цвета, его синонимы и (необязательно)
// модели, для которых оно действует. Правила с моделями проверяются раньше общих —
// так один и тот же синоним может значить разное у разных моделей
// (например, "Blue" у iPhone 18 — это Glacier, а у остальных — Blue).
export type ColorRule = {
  color: string;
  keywords: string[];
  models?: string[];
};

type ColorMatch = {
  canonical: string;
  start: number;
  end: number;
  scoped: boolean;
};

let colorRules: ColorRule[] = [];

function toRules(data: unknown): ColorRule[] {
  // Старый формат colors.json — { "Цвет": ["синоним", ...] }, без моделей.
  if (!Array.isArray(data)) {
    return Object.entries(data as Record<string, string[]>)
      .map(([color, keywords]) => ({ color, keywords }));
  }
  return data as ColorRule[];
}

export function loadColorsFromFile() {
  if (fs.existsSync(COLORS_PATH)) {
    const data = JSON.parse(fs.readFileSync(COLORS_PATH, 'utf-8'));
    colorRules = toRules(data);
  }
}

export async function saveColors(update: ColorRule[]) {
  writeJsonFileAtomic(COLORS_PATH, update);
  colorRules = update;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// "iPhone 18" подходит к "iPhone 18 Pro Max ...", но не к "iPhone 180".
function nameHasModel(lowerName: string, model: string): boolean {
  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(model.toLowerCase())}(?![0-9])`);
  return pattern.test(lowerName);
}

// Самый длинный синоним из правил, подходящих к названию. Если сработало правило
// с моделями — оно важнее любого общего, даже более длинного.
function findColorMatch(productName: string): ColorMatch | null {
  const lowerName = productName.toLowerCase();
  let best: (ColorMatch & { length: number }) | null = null;

  for (const rule of colorRules) {
    const scoped = Boolean(rule.models?.length);
    if (scoped && !rule.models!.some(model => nameHasModel(lowerName, model))) {
      continue;
    }

    for (const keyword of rule.keywords) {
      const index = lowerName.indexOf(keyword.toLowerCase());
      if (index === -1) continue;

      const length = keyword.length;
      const better =
        !best ||
        (scoped && !best.scoped) ||
        (scoped === best.scoped && length > best.length);

      if (better) {
        best = { canonical: rule.color, start: index, end: index + length, scoped, length };
      }
    }
  }

  return best;
}

export function resolveColorFromName(name: string): string | undefined {
  return findColorMatch(name)?.canonical;
}

// В отличие от normalizeColorInProductName (заменяет синоним на каноническое имя цвета),
// эта функция вырезает упоминание цвета целиком — нужна там, где нам важно посмотреть
// что осталось от названия ПОСЛЕ вычитания всех распознанных токенов (см. isIphoneAccessoryName в xlsx.service.ts).
export function removeColorFromName(productName: string): string {
  const match = findColorMatch(productName);
  if (!match) return productName;

  const before = productName.slice(0, match.start);
  const after = productName.slice(match.end);
  return `${before} ${after}`.replace(/\s+/g, ' ').trim();
}

// Заменяет синоним цвета в названии на каноническое имя ("Space Black" → "Black").
// scopedOnly — менять только по правилам с моделями (для прайса aaa-store, где
// в остальном название товара сохраняется как в прайсе).
export function normalizeColorInProductName(
  productName: string,
  options?: { scopedOnly?: boolean },
): string {
  const match = findColorMatch(productName);
  if (!match) return productName;
  if (options?.scopedOnly && !match.scoped) return productName;

  const before = productName.slice(0, match.start);
  const after = productName.slice(match.end);
  return `${before}${match.canonical}${after}`.replace(/\s+/g, ' ').trim();
}
