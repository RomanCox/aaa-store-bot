import fs from "fs";
import path from "path";
import crypto from "crypto";
import { PRODUCTS_CACHE_PATH } from "../constants";
import { CachedProduct } from "../types";
import { writeJsonFileAtomic } from "../utils";
import { getNamedIphoneDeviceModel } from "../services/products/iphone.models";

export interface IphoneDuoChange {
  id: string;
  name: string;
  before: { category: string; model: string };
  after: { category: string; model: string };
}

export function planIphoneDuoMigration(products: CachedProduct[]) {
  const changes: IphoneDuoChange[] = [];
  const updated = products.map(product => {
    if (product.brand !== "Apple" || getNamedIphoneDeviceModel(product.name) !== "iPhone Duo") return product;
    if (product.category === "Смартфоны" && product.model === "iPhone Duo") return product;
    const after = { category: "Смартфоны", model: "iPhone Duo" };
    changes.push({ id: product.id, name: product.name, before: { category: product.category, model: product.model }, after });
    return { ...product, ...after };
  });
  return { products: updated, changes };
}

function parseProductCache(raw: string): CachedProduct[] {
  const list: unknown = JSON.parse(raw);
  if (!Array.isArray(list) || !list.every(product => product &&
    [product.id, product.name, product.brand, product.category, product.model].every(value => typeof value === "string") &&
    Array.isArray(product.rawNames) && product.rawNames.every((name: unknown) => typeof name === "string")
  )) throw new Error("Миграция iPhone Duo: неверная структура products-cache.json, запись отменена");
  if (new Set(list.map(product => product.id)).size !== list.length) {
    throw new Error("Миграция iPhone Duo: повторяющиеся ID в кеше, запись отменена");
  }
  return list;
}

export function migrateIphoneDuoCache(options: {
  cachePath?: string;
  apply?: boolean;
  log?: (message: string) => void;
} = {}) {
  const cachePath = path.resolve(options.cachePath ?? PRODUCTS_CACHE_PATH);
  const log = options.log ?? console.log;
  if (!fs.existsSync(cachePath)) {
    log("Миграция iPhone Duo: файл кеша отсутствует, пропуск.");
    return { changes: [] as IphoneDuoChange[] };
  }
  const original = fs.readFileSync(cachePath);
  const plan = planIphoneDuoMigration(parseProductCache(original.toString("utf8")));
  log(`Миграция iPhone Duo: исправлений ${plan.changes.length}; ID и число карточек сохраняются.`);
  for (const change of plan.changes) {
    log(`${change.id} | ${change.name} | ${change.before.category} / ${change.before.model} → ${change.after.category} / ${change.after.model}`);
  }
  if (!plan.changes.length || !options.apply) return { changes: plan.changes };

  const backupDir = path.resolve(path.dirname(cachePath), "../backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = `${new Date().toISOString().replace(/[:.]/g, "-")}.${crypto.randomBytes(4).toString("hex")}`;
  const backupPath = path.join(backupDir, `products-cache.before-iphone-duo.${stamp}.json`);
  const reportPath = path.join(backupDir, `migrate-iphone-duo.${stamp}.json`);
  fs.writeFileSync(backupPath, original, { flag: "wx" });
  // Отчёт содержит план исправлений; успешную запись подтверждает лог ниже.
  fs.writeFileSync(reportPath, JSON.stringify({ cachePath, backupPath, changes: plan.changes }, null, 2), { flag: "wx" });
  if (!fs.readFileSync(cachePath).equals(original)) {
    throw new Error("Миграция iPhone Duo: кеш изменился во время выполнения, запись отменена");
  }
  writeJsonFileAtomic(cachePath, plan.products);
  log(`Миграция iPhone Duo завершена. Резервная копия: ${backupPath}. Отчёт: ${reportPath}`);
  return { changes: plan.changes, backupPath, reportPath };
}
