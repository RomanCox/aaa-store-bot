import fs from "fs";
import { BRANDS_PATH } from "../constants";

let brands = new Map<string, string[]>();

export function loadBrandsFromFile() {
  if (fs.existsSync(BRANDS_PATH)) {
    const data = JSON.parse(fs.readFileSync(BRANDS_PATH, 'utf-8'));
    brands.clear();
    for (const [key, value] of Object.entries(data)) {
      brands.set(key, value as string[]);
    }
  }
}

export async function saveBrands(update: Record<string, string[]>[]) {
  const normalizedData: Record<string, string[]> = {};

  for (const item of update) {
    const [brandName, keywords] = Object.entries(item)[0];
    normalizedData[brandName] = keywords;
  }

  fs.writeFileSync(
    BRANDS_PATH,
    JSON.stringify(normalizedData, null, 2),
    "utf-8"
  );

  brands.clear();
  for (const [brandName, keywords] of Object.entries(normalizedData)) {
    brands.set(brandName, keywords);
  }
}

export function resolveBrandFromName(name: string): string | undefined {
  const trimmedName = name.trim().toLowerCase();
  if (!trimmedName) return undefined;

  for (const [brand, keyWords] of brands.entries()) {
    for (const kw of keyWords) {
      const lowerKw = kw.toLowerCase();
      // Проверяем, начинается ли строка с ключевого слова, за которым следует пробел или конец
      if (trimmedName.startsWith(lowerKw + ' ') || trimmedName === lowerKw) {
        return brand;
      }
    }
  }

  return undefined;
}

export function brandsFromConfig() {
  return Array.from(brands.keys());
}

export function extractBrandFromStart(name: string): {
  brand?: string;
  nameWithoutBrand: string;
} {
  const original = name.trimStart();
  const lower = original.toLowerCase();

  let matchedBrand: string | undefined;
  let matchedLength = 0;

  for (const [brand, keyWords] of brands.entries()) {
    for (const keyWord of keyWords) {
      const key = keyWord.toLowerCase();
      const nextChar = lower.charAt(key.length);

      // Ключевое слово должно совпадать с началом строки целиком (за ним пробел или конец строки),
      // иначе "SE"/"Mac" ложно матчатся на "Sensor"/"Machine" и т.п.
      if (
        lower.startsWith(key) &&
        (nextChar === "" || /\s/.test(nextChar)) &&
        key.length > matchedLength
      ) {
        matchedBrand = brand;
        matchedLength = key.length;
      }
    }
  }

  if (!matchedBrand) {
    return {
      brand: undefined,
      nameWithoutBrand: original,
    };
  }

  // обрезаем бренд + пробел после него
  const nameWithoutBrand = original.slice(matchedLength).trimStart();

  return {
    brand: matchedBrand,
    nameWithoutBrand,
  };
}