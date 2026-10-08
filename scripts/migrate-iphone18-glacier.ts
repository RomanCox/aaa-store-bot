// Разовая правка кеша: у iPhone 18 цвета Blue / Glacier / Glacier Blue — это один цвет Glacier.
// Новые карточки получают его сами (строка таблицы "Цвета" с колонкой "Модели" = iPhone 18),
// а у уже созданных name и attributes.color остаются старыми — этот скрипт их выравнивает.
// Id карточек не меняются.
//
// Перед запуском с --apply остановите бота: он держит кеш в памяти и при следующем
// сохранении перезапишет файл старой версией.
//
// Запуск из корня проекта:
//   npx ts-node scripts/migrate-iphone18-glacier.ts          — только показать изменения
//   npx ts-node scripts/migrate-iphone18-glacier.ts --apply  — бэкап в backups/ и запись кеша

import fs from "fs";
import path from "path";
import { PRODUCTS_CACHE_PATH } from "../src/constants";
import { loadProductCache, getProductCacheValues, saveProductCache } from "../src/services/products/products.service";

const apply = process.argv.includes("--apply");
const IPHONE_18 = /^iPhone 18(?!\d)/;
const OLD_COLOR = /glacier blue|glacier|blue/i;
const NEW_COLOR = "Glacier";

function main() {
  loadProductCache();

  let changed = 0;

  for (const p of getProductCacheValues()) {
    if (p.brand !== "Apple" || !IPHONE_18.test(p.model ?? "")) continue;

    const color = p.attributes?.color ?? "";
    if (!OLD_COLOR.test(color) && !OLD_COLOR.test(p.name)) continue;

    const name = p.name.replace(OLD_COLOR, NEW_COLOR).replace(/\s+/g, " ").trim();
    if (name === p.name && color === NEW_COLOR) continue;

    console.log(`${p.id}  ${p.name} [${color}]  →  ${name} [${NEW_COLOR}]`);

    if (apply) {
      p.name = name;
      p.attributes = { ...p.attributes, color: NEW_COLOR };
    }
    changed++;
  }

  if (!changed) {
    console.log("Менять нечего.");
    return;
  }

  if (!apply) {
    console.log(`\nИзменится карточек: ${changed}. Запустите с --apply, чтобы применить.`);
    return;
  }

  const backupDir = path.resolve(path.dirname(PRODUCTS_CACHE_PATH), "../backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(
    backupDir,
    `products-cache.${new Date().toISOString().replace(/[:.]/g, "-")}.json`
  );
  fs.copyFileSync(PRODUCTS_CACHE_PATH, backupPath);

  saveProductCache();

  console.log(`\nИзменено карточек: ${changed}. Бэкап: ${backupPath}`);
}

main();
