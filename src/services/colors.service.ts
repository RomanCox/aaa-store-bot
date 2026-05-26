import fs from "fs";
import { COLORS_PATH } from "../constants";

let colors = new Map<string, string[]>();

export function loadColorsFromFile() {
  if (fs.existsSync(COLORS_PATH)) {
    const data = JSON.parse(fs.readFileSync(COLORS_PATH, 'utf-8'));
    colors.clear();
    for (const [key, value] of Object.entries(data)) {
      colors.set(key, value as string[]);
    }
  }
}

export async function saveColors(update: Record<string, string[]>[]) {
  const normalizedData: Record<string, string[]> = {};

  for (const item of update) {
    const [colorName, keywords] = Object.entries(item)[0];
    normalizedData[colorName] = keywords;
  }

  fs.writeFileSync(
    COLORS_PATH,
    JSON.stringify(normalizedData, null, 2),
    "utf-8"
  );

  colors.clear();
  for (const [colorName, keywords] of Object.entries(normalizedData)) {
    colors.set(colorName, keywords);
  }
}

export function resolveColorFromName(name: string): string | undefined {
  const lower = name.toLowerCase();

  const entries = Array.from(colors.entries())
    .flatMap(([color, keywords]) =>
      keywords.map(keyword => ({
        color,
        keyword,
      }))
    )
    .sort((a, b) => b.keyword.length - a.keyword.length);

  for (const entry of entries) {
    if (lower.includes(entry.keyword.toLowerCase())) {
      return entry.color;
    }
  }

  return undefined;
}

export function normalizeColorInProductName(productName: string): string {
  const lowerName = productName.toLowerCase();
  let bestMatch: {
    synonym: string;
    canonical: string;
    start: number;
    end: number;
    length: number;
  } | null = null;

  // Перебираем все канонические цвета и их синонимы
  for (const [canonical, synonyms] of colors.entries()) {
    for (const synonym of synonyms) {
      const lowerSynonym = synonym.toLowerCase();
      const index = lowerName.indexOf(lowerSynonym);
      if (index !== -1) {
        const length = synonym.length;
        // Выбираем самое длинное совпадение (чтобы "Space Black" заменилось целиком, а не только "Black")
        if (!bestMatch || length > bestMatch.length) {
          bestMatch = {
            synonym,
            canonical,
            start: index,
            end: index + length,
            length,
          };
        }
      }
    }
  }

  if (!bestMatch) return productName;

  // Замена: часть исходной строки от start до end заменяется на каноническое название цвета
  const before = productName.slice(0, bestMatch.start);
  const after = productName.slice(bestMatch.end);
  let result = `${before}${bestMatch.canonical}${after}`;
  result = result.replace(/\s+/g, ' ').trim();
  return result;
}