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

  for (const [brand, keyWords] of brands.entries()) {
    if (
      keyWords.some(keyWord =>
        trimmedName.startsWith(keyWord.toLowerCase())
      )
    ) {
      return brand;
    }
  }

  return undefined;
}

export function brandsFromConfig() {
  return Array.from(brands.keys());
}

export function keyWordsFromConfig() {
  return Array.from(brands.values());
}