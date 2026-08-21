import fs from "fs";
import { BRANDS_PATH } from "../constants";
import { writeJsonFileAtomic } from "../utils/atomicWrite";

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

  writeJsonFileAtomic(BRANDS_PATH, normalizedData);

  brands.clear();
  for (const [brandName, keywords] of Object.entries(normalizedData)) {
    brands.set(brandName, keywords);
  }
}

// export function resolveBrandFromName(name: string): string | undefined {
//   if (!name || !name.trim()) return undefined;
//
//   // Нормализуем строку: заменяем все виды пробелов на один обычный
//   const normalized = name
//     .trim()
//     .replace(/\s+/g, ' ')
//     .toLowerCase();
//
//   for (const [brand, keyWords] of brands.entries()) {
//     for (const kw of keyWords) {
//       const lowerKw = kw.toLowerCase();
//
//       // Экранируем спецсимволы в ключевом слове
//       const escapedKw = lowerKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
//       const pattern = new RegExp(`^${escapedKw}(\\s|$)`);
//
//       if (pattern.test(normalized)) {
//         return brand;
//       }
//     }
//   }
//
//   return undefined;
// }

export function resolveBrandFromName(name: string): string | undefined {
  if (!name || !name.trim()) return undefined;

  const normalized = name
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

  for (const [brand, keyWords] of brands.entries()) {
    for (const kw of keyWords) {
      const lowerKw = kw.toLowerCase();
      const escapedKw = lowerKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`^${escapedKw}(\\s|$)`, 'u');

      if (pattern.test(normalized)) {
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