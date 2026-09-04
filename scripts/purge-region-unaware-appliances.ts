// Временный скрипт-миграция (удалить после использования).
//
// До этого коммита товары категорий "Пылесосы", "Фен", "Стайлер", "Выпрямитель",
// "Очистители/увлажнители" не учитывали регион (вилку) в id — разные региональные
// версии одного товара с разной ценой схлопывались в одну карточку каталога
// (побеждала самая дешёвая цена, см. getCatalogProducts). Теперь id этих категорий
// строится с учётом region (см. isRegionSensitiveCategory + generateId), поэтому
// старые записи без региона "осиротели": их id больше не совпадёт с тем, что
// сгенерирует следующий AAA-store прайс, и они просто зависнут в кеше мёртвым грузом.
//
// Скрипт удаляет из кеша товаров и из каталога все товары этих категорий, у которых
// не проставлен attributes.country — при следующей загрузке AAA-store прайса они
// будут созданы заново, уже отдельной карточкой на каждый регион.
//
// Запуск из корня проекта:
//   npx ts-node scripts/purge-region-unaware-appliances.ts --dry-run   — только посмотреть
//   npx ts-node scripts/purge-region-unaware-appliances.ts             — реально удалить (с бэкапом .bak рядом)

import fs from "fs";
import path from "path";
import { PRODUCTS_CACHE_PATH } from "../src/constants";
import { REGION_SENSITIVE_CATEGORIES } from "../src/constants/category";
import { CachedProduct, CatalogItem } from "../src/types";

// catalog.service.ts хранит каталог по этому же относительному пути (не через DATA_PATH) —
// повторяем это же поведение, чтобы точно попасть в файл, который реально читает бот.
const CATALOG_PATH = path.resolve(process.cwd(), "data/catalog.json");

const dryRun = process.argv.includes("--dry-run");

function backup(filePath: string) {
  fs.writeFileSync(`${filePath}.bak`, fs.readFileSync(filePath));
}

function main() {
  if (!fs.existsSync(PRODUCTS_CACHE_PATH)) {
    console.log("Кеш товаров не найден:", PRODUCTS_CACHE_PATH);
    return;
  }

  const products: CachedProduct[] = JSON.parse(
    fs.readFileSync(PRODUCTS_CACHE_PATH, "utf8")
  );

  const isTarget = (p: CachedProduct) =>
    REGION_SENSITIVE_CATEGORIES.has(p.category) && !p.attributes?.country;

  const toRemove = products.filter(isTarget);
  const toKeep = products.filter(p => !isTarget(p));

  console.log(`Всего товаров в кеше: ${products.length}`);
  console.log(`Без региона (будут удалены): ${toRemove.length}`);
  for (const p of toRemove) {
    console.log(`  • [${p.category}] ${p.name} — ${p.id}`);
  }

  if (!toRemove.length) {
    console.log("Нечего удалять — все товары этих категорий уже с регионом.");
    return;
  }

  const removedIds = new Set(toRemove.map(p => p.id));

  let catalog: CatalogItem[] = [];
  let catalogRemovedCount = 0;
  if (fs.existsSync(CATALOG_PATH)) {
    catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
    const before = catalog.length;
    catalog = catalog.filter(item => !removedIds.has(item.productId));
    catalogRemovedCount = before - catalog.length;
  }
  console.log(`Записей каталога будет удалено: ${catalogRemovedCount}`);

  if (dryRun) {
    console.log("\n--dry-run: файлы не изменены.");
    return;
  }

  backup(PRODUCTS_CACHE_PATH);
  if (fs.existsSync(CATALOG_PATH)) backup(CATALOG_PATH);

  fs.writeFileSync(PRODUCTS_CACHE_PATH, JSON.stringify(toKeep, null, 2), "utf-8");
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), "utf-8");

  console.log("\nГотово. Бэкапы сохранены рядом (.bak). Перезагрузите AAA-store прайс, чтобы пересоздать эти товары с учётом региона.");
}

main();
