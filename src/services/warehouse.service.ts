import fs from "fs";
import { WAREHOUSE_PATH } from "../constants";
import { IngestResult, WarehousePriceRow } from "../types";
import { writeJsonFileAtomic } from "../utils";
import { replaceCatalogSource, saveCatalog } from "./catalog/catalog.service";
import { ingestWarehousePrices, ingestWarehouseProducts } from "./xlsx.service";
import { getProductCache, saveProductCache } from "./products/products.service";
import { addRawNameIfNeeded } from "./products/product.builder";

let warehouse: WarehousePriceRow[] = [];
let lastResult: IngestResult & { aiCost: number } = { items: [], skipped: [], totalRows: 0, aiCost: 0 };
let pendingUpdate: Promise<void> = Promise.resolve();

export function getWarehouse(): WarehousePriceRow[] {
  return warehouse.map(row => ({ ...row }));
}

export function getWarehouseIngestResult() {
  return structuredClone(lastResult);
}

function parseWarehouse(data: unknown): WarehousePriceRow[] {
  if (!Array.isArray(data) || !data.every(row =>
    row && typeof row.name === "string" && typeof row.price === "string"
  )) {
    throw new Error("Неверный формат warehouse.json");
  }
  return data.map(row => ({ name: row.name, price: row.price }));
}

export function loadWarehouseFromFile() {
  // До первого обновления новый файл может отсутствовать: сохраняем предложения
  // из старого catalog.json. Создавать файлы и обращаться к Google на старте не нужно.
  if (!fs.existsSync(WAREHOUSE_PATH)) {
    warehouse = [];
    lastResult = { items: [], skipped: [], totalRows: 0, aiCost: 0 };
    return;
  }

  try {
    const rows = parseWarehouse(JSON.parse(fs.readFileSync(WAREHOUSE_PATH, "utf8")));
    const result = ingestWarehousePrices(rows);
    warehouse = rows;
    lastResult = { ...result, aiCost: 0 };
    replaceCatalogSource("warehouse", result.items);
  } catch (error) {
    console.error("❌ Ошибка чтения warehouse.json", error);
  }
}

export async function saveWarehouse(update: WarehousePriceRow[]) {
  const rows = parseWarehouse(update);
  // Повторные нажатия кнопки не запускают параллельное создание одних карточек.
  const job = pendingUpdate.then(() => saveWarehouseSnapshot(rows));
  pendingUpdate = job.catch(() => {});
  await job;
}

async function saveWarehouseSnapshot(rows: WarehousePriceRow[]) {
  const result = await ingestWarehouseProducts(rows);
  // Сначала надёжно сохраняем исходный снимок, затем меняем память.
  // catalog.json — производные предложения; при старте они восстановятся из снимка.
  writeJsonFileAtomic(WAREHOUSE_PATH, rows);
  const cache = getProductCache();
  const before = new Map(cache);
  try {
    for (const update of result.cacheUpdates) {
      const existing = cache.get(update.id);
      const product = existing ? { ...existing, rawNames: [...existing.rawNames] } : update;
      for (const raw of update.rawNames) addRawNameIfNeeded(product, raw);
      cache.set(product.id, product);
    }
    if (result.cacheUpdates.length) saveProductCache();
  } catch (error) {
    cache.clear();
    for (const [id, product] of before) cache.set(id, product);
    throw error;
  }
  warehouse = rows;
  lastResult = { items: result.items, skipped: result.skipped, totalRows: result.totalRows, aiCost: result.aiCost };
  replaceCatalogSource("warehouse", result.items);
  saveCatalog();
}
