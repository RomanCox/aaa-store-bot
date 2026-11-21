import fs from "fs";
import { CatalogItem, IngestItem, PriceListType, Rates } from "../../types";
import { normalizeOfferPrice, writeJsonFileAtomic } from "../../utils";
import { getRates } from "../price.service";

const CATALOG_PATH = "./data/catalog.json";

const catalog = new Map<string, CatalogItem>();

export function findBestCatalogOffer(offers: CatalogItem["offers"], rates: Rates, warehouse: boolean) {
  let best: { offer: CatalogItem["offers"][number]; priceUsd: number } | undefined;
  for (const offer of offers) {
    if ((offer.source === "warehouse") !== warehouse) continue;
    const priceUsd = normalizeOfferPrice(offer, rates);
    if (Number(offer.price) <= 0 || !Number.isFinite(priceUsd) || priceUsd <= 0) continue;
    if (!best || priceUsd < best.priceUsd) best = { offer, priceUsd };
  }
  return best;
}

// ---------------- LOAD/SAVE ----------------

export function loadCatalog() {
  if (!fs.existsSync(CATALOG_PATH)) return;

  const raw = fs.readFileSync(CATALOG_PATH, "utf8");
  const list: CatalogItem[] = JSON.parse(raw);

  catalog.clear();

  for (const item of list) {
    if (item.lastMarketPrice && Number.isFinite(item.lastMarketPrice.priceUsd)) {
      item.lastMarketPrice.priceUsd = Math.round(item.lastMarketPrice.priceUsd);
    }
    catalog.set(item.productId, item);
  }
}

export function saveCatalog() {
  writeJsonFileAtomic(CATALOG_PATH, Array.from(catalog.values()));
}

// ---------------- CLEAR PRICES ----------------

export function clearCatalogSource(source: PriceListType) {
  for (const [id, item] of catalog.entries()) {
    item.offers = item.offers.filter(
      o => o.source !== source
    );

    if (item.offers.length === 0 && !item.lastMarketPrice) {
      catalog.delete(id);
    }
  }
}

// Общая замена снимка одного источника для импорта и локального восстановления.
export function replaceCatalogSource(source: PriceListType, items: IngestItem[]) {
  const affected = new Set<string>();
  const rates = getRates();
  if (source !== "warehouse") {
    for (const item of catalog.values()) {
      if (!item.offers.some(offer => offer.source === source)) continue;
      affected.add(item.productId);
      // Старый файл не содержит даты исходного предложения.
      if (!item.lastMarketPrice) {
        const previous = findBestCatalogOffer(item.offers, rates, false);
        if (previous) item.lastMarketPrice = { priceUsd: Math.round(previous.priceUsd), observedAt: null };
      }
    }
    for (const item of items) affected.add(item.product.id);
  }

  clearCatalogSource(source);
  for (const item of items) {
    upsertCatalog(item.product.id, item.price, source, item.country);
  }

  const observedAt = new Date().toISOString();
  for (const id of affected) {
    const item = catalog.get(id);
    if (!item) continue;
    const current = findBestCatalogOffer(item.offers, rates, false);
    if (current) item.lastMarketPrice = { priceUsd: Math.round(current.priceUsd), observedAt };
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
  return Array.from(catalog.values()).filter(item => item.offers.length > 0);
}

export function getCatalogItem(productId: string) {
  const item = catalog.get(productId);
  return item?.offers.length ? item : undefined;
}
