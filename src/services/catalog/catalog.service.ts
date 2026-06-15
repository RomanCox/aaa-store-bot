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

// ---------------- CLEAR PRICES ----------------

export function clearCatalogSource(source: PriceListType) {
  for (const [id, item] of catalog.entries()) {
    item.offers = item.offers.filter(
      o => o.source !== source
    );

    // если офферов больше нет — удаляем товар
    if (item.offers.length === 0) {
      catalog.delete(id);
    }
  }
}

// ---------------- UPSERT ----------------

export function upsertCatalog(
  productId: string,
  price: string,
  source: PriceListType,
  country?: string,
) {
  const existing = catalog.get(productId);

  if (existing) {
    if (!existing.offers) {
      existing.offers = [];
    }

    const existingOffer = existing.offers.find(
      o => o.source === source && o.country === country
    );

    if (existingOffer) {
      existingOffer.price = price;
    } else {
      existing.offers.push({ price, source,country });
    }
  } else {
    catalog.set(productId, {
      productId,
      offers: [{ price, source, country }],
    });
  }
}

// ---------------- GET ----------------

export function getCatalog(): CatalogItem[] {
  return Array.from(catalog.values());
}

export function getCatalogItem(productId: string) {
  return catalog.get(productId);
}