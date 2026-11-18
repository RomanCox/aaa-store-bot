import fs from "fs";
import { WAREHOUSE_PATH } from "../constants";
import { WarehousePriceRow } from "../types";
import { writeJsonFileAtomic } from "../utils";
import { replaceCatalogSource, saveCatalog } from "./catalog/catalog.service";
import { ingestWarehousePrices } from "./xlsx.service";

let warehouse: WarehousePriceRow[] = [];

export function getWarehouse(): WarehousePriceRow[] {
  return warehouse.map(row => ({ ...row }));
}

export function getWarehouseIngestResult() {
  return ingestWarehousePrices(warehouse);
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
    return;
  }

  try {
    const rows = parseWarehouse(JSON.parse(fs.readFileSync(WAREHOUSE_PATH, "utf8")));
    const result = ingestWarehousePrices(rows);
    warehouse = rows;
    replaceCatalogSource("warehouse", result.items);
  } catch (error) {
    console.error("❌ Ошибка чтения warehouse.json", error);
  }
}

export async function saveWarehouse(update: WarehousePriceRow[]) {
  const rows = parseWarehouse(update);
  const result = ingestWarehousePrices(rows);
  // Сначала надёжно сохраняем исходный снимок, затем меняем память.
  // catalog.json — производные предложения; при старте они восстановятся из снимка.
  writeJsonFileAtomic(WAREHOUSE_PATH, rows);
  warehouse = rows;
  replaceCatalogSource("warehouse", result.items);
  saveCatalog();
}
