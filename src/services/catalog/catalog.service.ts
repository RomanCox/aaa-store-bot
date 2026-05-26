import fs from "fs";
import { CatalogItem, PriceListType} from "../../types";

const CATALOG_PATH = "./data/catalog.json";

let catalog = new Map<string, CatalogItem>();

// ---------------- LOAD/SAVE ----------------

export function loadCatalog() {
  if (!fs.existsSync(CATALOG_PATH)) return;

  const raw = fs.readFileSync(CATALOG_PATH, "utf8");
  const list: CatalogItem[] = JSON.parse(raw);

  catalog.clear();

  for (const item of list) {
    catalog.set(item.productId, item);
  }
}

export function saveCatalog() {
  const list = Array.from(catalog.values());

  fs.writeFileSync(
    CATALOG_PATH,
    JSON.stringify(list, null, 2),
    "utf-8"
  );
}

// ---------------- UPSERT ----------------

export function upsertCatalog(
  productId: string,
  price: string,
  source: PriceListType
) {
  const existing = catalog.get(productId);

  // если нет — добавляем
  if (!existing) {
    catalog.set(productId, {
      productId,
      offers: [{ price, source }],
    });
    return;
  }

  // проверяем есть ли уже такой source
  const existingOffer = existing.offers.find(o => o.source === source);

  if (existingOffer) {
    // обновляем цену
    existingOffer.price = price;
  } else {
    // добавляем нового поставщика
    existing.offers.push({ price, source });
  }
}

// ---------------- GET ----------------

export function getCatalog(): CatalogItem[] {
  return Array.from(catalog.values());
}

export function getCatalogItem(productId: string) {
  return catalog.get(productId);
}