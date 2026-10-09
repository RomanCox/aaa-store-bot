// Разовая правка кеша: у iPhone 18 цвета Blue / Glacier / Glacier Blue — это один цвет Glacier.
// Новые карточки получают его сами (строка таблицы "Цвета" с колонкой "Модели" = iPhone 18),
// а у уже созданных name и attributes.color остаются старыми — этот скрипт их выравнивает.
//
// 1. У всех карточек iPhone 18 с Blue/Glacier/Glacier Blue: name и color → Glacier. Id не меняются.
// 2. Если после этого у нескольких карточек совпали все атрибуты (один и тот же телефон,
//    созданный дважды — из "Blue" и из "Glacier"), они сливаются в одну: остаётся карточка,
//    которая в прайсе называлась "Blue" (её id сохраняется), rawNames остальных переносятся
//    в неё, а сами остальные карточки удаляются.
//
// Id — то, по чему товары связаны с сайтом, поэтому скрипт печатает отчёт по id и
// сверяет списки id до и после: единственное допустимое изменение — удаление слитых карточек.
// С --apply отчёт сохраняется рядом с бэкапом кеша в backups/.
//
// Перед запуском с --apply остановите бота: он держит кеш в памяти и при следующем
// сохранении перезапишет файл старой версией.
//
// Запуск из корня проекта:
//   npx ts-node scripts/migrate-iphone18-glacier.ts          — только показать изменения
//   npx ts-node scripts/migrate-iphone18-glacier.ts --apply  — бэкап в backups/ и запись кеша

import fs from "fs";
import path from "path";
import { DATA_PATH, ORDERS_PATH, PRODUCTS_CACHE_PATH } from "../src/constants";
import { CachedProduct } from "../src/types";
import { getProductCache, loadProductCache, saveProductCache } from "../src/services/products/products.service";
import { normalize } from "../src/services/products/product.builder";

const apply = process.argv.includes("--apply");
const IPHONE_18 = /^iPhone 18(?!\d)/;
const OLD_COLOR = /glacier blue|glacier|blue/i;
const NEW_COLOR = "Glacier";
const CATALOG_PATH = path.join(DATA_PATH, "catalog.json");

type Renamed = { product: CachedProduct; oldName: string; oldColor: string };
type Merge = { kept: Renamed; removed: Renamed[] };

const lines: string[] = [];
const out = (line = "") => {
  lines.push(line);
  console.log(line);
};

function attributesKey(p: CachedProduct): string {
  const a = p.attributes ?? {};
  return [p.brand, p.category, p.model, a.storage, a.color, a.country, a.sim, a.activated === true]
    .map(v => normalize(String(v ?? "")))
    .join("|");
}

// "Blue"-карточка — та, которую прайс хоть раз называл просто "Blue" (без Glacier).
// Смотрим на rawNames, а не на name: name мог уже стать Glacier при прошлом запуске.
function pickKept(group: Renamed[]): Renamed {
  const isBlue = (r: Renamed) =>
    r.product.rawNames.some(raw => /\bblue\b/i.test(raw) && !/glacier/i.test(raw));
  return [...group].sort((a, b) =>
    Number(isBlue(b)) - Number(isBlue(a)) ||
    b.product.rawNames.length - a.product.rawNames.length
  )[0];
}

// Где ещё встречается id: сайт/каталог и заказы — чтобы было видно, что затронет удаление.
function referencesOf(id: string): string[] {
  const refs: string[] = [];
  for (const [label, file] of [["каталог", CATALOG_PATH], ["заказы", ORDERS_PATH]] as const) {
    if (fs.existsSync(file) && fs.readFileSync(file, "utf8").includes(id)) refs.push(label);
  }
  return refs;
}

function main() {
  loadProductCache();
  const cache = getProductCache();
  const idsBefore = new Set(cache.keys());

  // 1. Переименование
  const renamed: Renamed[] = [];
  for (const p of cache.values()) {
    if (p.brand !== "Apple" || !IPHONE_18.test(p.model ?? "")) continue;

    const oldColor = p.attributes?.color ?? "";
    if (!OLD_COLOR.test(oldColor) && !OLD_COLOR.test(p.name)) continue;

    const oldName = p.name;
    p.name = p.name.replace(OLD_COLOR, NEW_COLOR).replace(/\s+/g, " ").trim();
    p.attributes = { ...p.attributes, color: NEW_COLOR };
    renamed.push({ product: p, oldName, oldColor });
  }

  // 2. Слияние карточек с одинаковыми атрибутами
  const groups = new Map<string, Renamed[]>();
  for (const r of renamed) {
    const key = attributesKey(r.product);
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }

  const merges: Merge[] = [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const kept = pickKept(group);
    const removed = group.filter(r => r !== kept);

    for (const r of removed) {
      for (const raw of r.product.rawNames) {
        if (!kept.product.rawNames.some(n => normalize(n) === normalize(raw))) {
          kept.product.rawNames.push(raw);
        }
      }
      cache.delete(r.product.id);
    }
    merges.push({ kept, removed });
  }

  const removedIds = new Set(merges.flatMap(m => m.removed.map(r => r.product.id)));

  // Отчёт. Карточки, которые уже Glacier (скрипт запускали раньше), в списке не показываем.
  const changed = renamed.filter(r => r.oldName !== r.product.name || r.oldColor !== NEW_COLOR);
  out(`=== Переименование: ${changed.length} карточек (id не меняются), уже Glacier: ${renamed.length - changed.length} ===`);
  for (const r of changed) {
    const mark = removedIds.has(r.product.id) ? "  ← удаляется при слиянии, см. ниже" : "";
    out(`${r.product.id}  ${r.oldName} [${r.oldColor}]  →  ${r.product.name} [${NEW_COLOR}]${mark}`);
  }

  out("");
  out(`=== Слияние: ${merges.length} товаров, удаляется карточек: ${removedIds.size} ===`);
  for (const { kept, removed } of merges) {
    out(`ОСТАЁТСЯ  ${kept.product.id}  ${kept.product.name}  (было: ${kept.oldName})`);
    for (const r of removed) {
      const refs = referencesOf(r.product.id);
      out(`УДАЛЯЕТСЯ ${r.product.id}  (было: ${r.oldName})${refs.length ? `  — есть в: ${refs.join(", ")}` : ""}`);
    }
    out(`  rawNames: ${kept.product.rawNames.join(" | ")}`);
    out("");
  }

  // Сверка id: допустимо только удаление слитых карточек
  const idsAfter = new Set(cache.keys());
  const disappeared = [...idsBefore].filter(id => !idsAfter.has(id));
  const unexpectedRemoved = disappeared.filter(id => !removedIds.has(id));
  const added = [...idsAfter].filter(id => !idsBefore.has(id));

  out("=== Итог по id ===");
  out(`Было карточек: ${idsBefore.size}, станет: ${idsAfter.size}`);
  out(`Удалено id (слияние): ${disappeared.length ? disappeared.join(", ") : "нет"}`);
  out(`Новых id: ${added.length ? added.join(", ") : "нет"}`);
  out(`Изменённых id: нет`);

  if (unexpectedRemoved.length || added.length) {
    out("");
    out(`❌ Неожиданные изменения id: удалены ${unexpectedRemoved.join(", ") || "—"}, добавлены ${added.join(", ") || "—"}. Кеш не записан.`);
    process.exitCode = 1;
    return;
  }

  if (!changed.length && !merges.length) {
    out("Менять нечего.");
    return;
  }

  if (!apply) {
    out("");
    out("Запустите с --apply, чтобы применить.");
    return;
  }

  const backupDir = path.resolve(path.dirname(PRODUCTS_CACHE_PATH), "../backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `products-cache.${stamp}.json`);
  const reportPath = path.join(backupDir, `migrate-iphone18-glacier.${stamp}.txt`);
  fs.copyFileSync(PRODUCTS_CACHE_PATH, backupPath);

  saveProductCache();

  out("");
  out(`Записано. Бэкап кеша: ${backupPath}`);
  out(`Отчёт: ${reportPath}`);
  fs.writeFileSync(reportPath, lines.join("\n") + "\n", "utf8");
}

main();
