import { test, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import type { CachedProduct, Order, Rates, UserRole } from "../src/types";

// Не загружаем .env и bootstrap. Все значения фиктивные и живут только в тестовом процессе.
for (const key of ["RETAIL_MANAGER_URL", "WHOLESALE_MANAGER_URL", "GOOGLE_APPLICATION_CREDENTIALS", "SPREADSHEET_CONFIG_ID", "SPREADSHEET_WAREHOUSE_ID"]) {
  process.env[key] = "warehouse-test-only";
}
process.env.ADMIN_ID = "1";
process.env.ADMIN_CHAT_ID = "2";
process.env.DEV = "1";
process.env.RETAIL_MANAGER_URL = "https://retail.example";
process.env.WHOLESALE_MANAGER_URL = "https://wholesale.example";

// Google client изолируется до загрузки sheets.service; ключи никогда не читаются.
const { google } = require("googleapis");
let sheetRows: unknown[][] = [];
let sheetCalls: any[] = [];
let sheetError: Error | undefined;
const sheetsStub = mock.method(google, "sheets", () => ({ spreadsheets: { values: {
  get: async (request: unknown) => {
    if (sheetError) throw sheetError;
    sheetCalls.push(request);
    return { data: { values: sheetRows } };
  },
} } }));
const sheets = require("../src/services/sheets.service") as typeof import("../src/services/sheets.service");
sheetsStub.mock.restore();
const warehouseService = require("../src/services/warehouse.service") as typeof import("../src/services/warehouse.service");
const warehouseReport = require("../src/render/warehouseChangesReport") as typeof import("../src/render/warehouseChangesReport");
const atomic = require("../src/utils/atomicWrite") as typeof import("../src/utils/atomicWrite");

const products = require("../src/services/products/products.service") as typeof import("../src/services/products/products.service");
const catalog = require("../src/services/catalog/catalog.service") as typeof import("../src/services/catalog/catalog.service");
const priceService = require("../src/services/price.service") as typeof import("../src/services/price.service");
const brands = require("../src/services/brands.service") as typeof import("../src/services/brands.service");
const ai = require("../src/ai/productAI") as typeof import("../src/ai/productAI");
const imports = require("../src/services/xlsx.service") as typeof import("../src/services/xlsx.service");
const { getCatalogProducts } = require("../src/services/catalog/catalog.builder") as typeof import("../src/services/catalog/catalog.builder");
const { getCatalogProductById, getCatalogUIProducts } = require("../src/services/catalog/ui/catalog.ui") as typeof import("../src/services/catalog/ui/catalog.ui");
const formatting = require("../src/utils/priceFormat") as typeof import("../src/utils/priceFormat");
const reports = require("../src/render/reports") as typeof import("../src/render/reports");
const exportHandler = require("../src/handlers/catalog.hanlder") as typeof import("../src/handlers/catalog.hanlder");
const { handleIngestResult } = require("../src/handlers/document.handler") as typeof import("../src/handlers/document.handler");
const { registerCallbacks } = require("../src/handlers/callback.handler") as typeof import("../src/handlers/callback.handler");
const { registerMessages } = require("../src/handlers/message.handler") as typeof import("../src/handlers/message.handler");
const users = require("../src/services/users.service") as typeof import("../src/services/users.service");
const actualUsers = { getUser: users.getUser, getUserRole: users.getUserRole, isAdmin: users.isAdmin };
const orders = require("../src/services/orders.service") as typeof import("../src/services/orders.service");
const rendering = require("../src/render/renderFlow") as typeof import("../src/render/renderFlow");
const actualRenderFlow = rendering.renderFlow;
const screens = require("../src/render/renderScreen") as typeof import("../src/render/renderScreen");
const configReport = require("../src/render/configChangesReport") as typeof import("../src/render/configChangesReport");
const { getChatState, setChatState } = require("../src/state/chat.state") as typeof import("../src/state/chat.state");
const { CALLBACK_TYPE, SECTION } = require("../src/types") as typeof import("../src/types");
const { TELEGRAM_MESSAGE_LIMIT, WAREHOUSE_PATH } = require("../src/constants") as typeof import("../src/constants");
const XLSX = require("xlsx") as typeof import("xlsx");
const fs = require("node:fs") as typeof import("node:fs");
const roleUtils = require("../src/utils/roles") as typeof import("../src/utils/roles");
const messageUtils = require("../src/utils/message.utils") as typeof import("../src/utils/message.utils");
const adminService = require("../src/services/admin.service") as typeof import("../src/services/admin.service");
const addUsers = require("../src/handlers/users/addUser.handler") as typeof import("../src/handlers/users/addUser.handler");
const editUsers = require("../src/handlers/users/editUser.handler") as typeof import("../src/handlers/users/editUser.handler");
const { MENU_TEXTS, ITEM_TEXTS, ADMIN_TEXTS } = require("../src/texts") as typeof import("../src/texts");
const iphoneModels = require("../src/services/products/iphone.models") as typeof import("../src/services/products/iphone.models");
const colors = require("../src/services/colors.service") as typeof import("../src/services/colors.service");

const rates: Rates = { rub_to_usd: 100, rub_to_byn: 4, usd_to_byn: 3 };
const product: CachedProduct = {
  id: "iphone", brand: "Apple", category: "Смартфоны", model: "iPhone 17",
  name: "iPhone 17 256GB Black", attributes: { storage: "256GB", color: "Black", sim: "ESIM" },
  rawNames: ["iPhone 17 256GB Black (ESIM)"],
};
let messages: string[];
let handlers: Record<string, (query: any) => Promise<void>>;
let bot: any;
let saveCatalog: any;
let saveWarehouseFile: any;

beforeEach(() => {
  messages = [];
  handlers = {};
  sheetRows = [];
  sheetCalls = [];
  sheetError = undefined;
  bot = {
    on: (event: string, handler: any) => { handlers[event] = handler; },
    sendMessage: async (_id: number, text: string) => { messages.push(text); return { message_id: 1 }; },
    answerCallbackQuery: async () => {}, deleteMessage: async () => {},
  };
  products.getProductCache().clear();
  products.setProductToCache(product.id, structuredClone(product));
  for (const source of ["AAA-store", "Today there tomorrow here", "warehouse"] as const) catalog.clearCatalogSource(source);
  mock.method(globalThis, "fetch", async () => { throw new Error("Network forbidden in tests"); });
  mock.method(fs, "writeFileSync", () => { throw new Error("Filesystem writes forbidden in tests"); });
  saveWarehouseFile = mock.method(atomic, "writeJsonFileAtomic", () => {});
  const missingWarehouse = mock.method(fs, "existsSync", () => false);
  warehouseService.loadWarehouseFromFile();
  users.loadUsers();
  missingWarehouse.mock.restore();
  mock.method(products, "saveProductCache", () => {});
  saveCatalog = mock.method(catalog, "saveCatalog", () => {});
  mock.method(exportHandler, "generateRetailCsv", () => {});
  mock.method(priceService, "getRates", () => rates);
  mock.method(priceService, "getPriceFormation", () => [{ prices: [
    { type: "wholesale", value: 10 }, { type: "retail", value: 20 },
  ] }]);
  mock.method(users, "getUserRole", () => "wholesale");
  mock.method(users, "getUser", () => ({ id: 10, role: "wholesale" } as any));
  mock.method(users, "isAdmin", () => true);
  mock.method(rendering, "renderFlow", async () => {});
  mock.method(screens, "renderScreen", async () => {});
  mock.method(ai, "callAIForProductMatch", async () => { throw new Error("AI forbidden in tests"); });
  mock.method(ai, "extractModelOnly", async () => { throw new Error("AI forbidden in tests"); });
  mock.method(ai, "callAIForProduct", async () => { throw new Error("AI forbidden in tests"); });
  setChatState(10, { mode: "idle", sections: { [SECTION.CART]: { flowStep: "main", currentOrder: [] } } as any });
});
afterEach(() => mock.restoreAll());

test("Google loader keeps positive stock in either column and returns A/D without quantity", async () => {
  sheetRows = [
    ["Название", "", "ЕД", "Цена", "NE"],
    ["ed-only", "", 2, 123.45],
    ["ne-only", "", "", 234.56, "3"],
    ["positive-ne", "", -5, 345.67, 1],
    ["both", "", 1, 456.78, 2],
    ["zero", "", 0, 100, 0],
    ["negative", "", -1, 100],
    ["bad", "", "?", 100, "?"],
    ["empty", "", "", 100, ""],
  ];
  assert.deepEqual(await sheets.loadWareHouse(), [
    { name: "ed-only", price: "123.45" },
    { name: "ne-only", price: "234.56" },
    { name: "positive-ne", price: "345.67" },
    { name: "both", price: "456.78" },
  ]);
  assert.equal(sheetCalls.length, 1);
  assert.equal(sheetCalls[0].range, "'склад'!A:H");
});

test("matches normalized rawNames, reports unknown names, never creates cache entries", () => {
  const result = imports.ingestWarehousePrices([
    { name: "  iphone 17 256GB black (ESIM)  ", price: "250.75" },
    { name: "unknown", price: "100" },
    { name: "iPhone 17 256GB Black", price: "100" }, // нет эвристики для отсутствующего SIM
  ]);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].product.id, product.id);
  assert.equal(result.items[0].price, "250.75");
  assert.deepEqual(result.skipped[0].names, ["unknown", "iPhone 17 256GB Black"]);
  assert.equal(products.getProductCache().size, 1);
});

test("separates activation, SIM, color and regional aliases", () => {
  const variants = [
    { id: "active", raw: "iPhone 17 256GB Black (ESIM) (Active)", activated: true },
    { id: "dual", raw: "iPhone 17 256GB Black (Dual SIM)", activated: false },
    { id: "white", raw: "iPhone 17 256GB White (ESIM)", activated: false },
    { id: "region", raw: "MacBook Air EU", activated: false },
  ];
  for (const item of variants) products.setProductToCache(item.id, { ...product, id: item.id, rawNames: [item.raw], attributes: { activated: item.activated } });
  const result = imports.ingestWarehousePrices(variants.map(item => ({ name: item.raw, price: "200" })));
  assert.deepEqual(result.items.map(item => item.product.id), variants.map(item => item.id));
});

for (const [name, rawName] of [
  ["iPhone 17 Pro 256 Orange Esim", "iPhone 17 Pro 256 Orange (ESIM)"],
  ["iPhone 16 Pro 128 White Dual Sim", "iPhone 16 Pro 128 White (Dual SIM)"],
  ["iPhone 18 Pro 256 Glacier Sim+esim", "iPhone 18 Pro 256 Glacier (SIM + ESIM)"],
  ["iPhone 18 Pro 512 Burgundy Sim+Esim", "iPhone 18 Pro 512 Burgundy (SIM + ESIM)"],
  ["iPhone 18 Pro 256 Glacier (Sim+esim)", "iPhone 18 Pro 256 Glacier (SIM + ESIM)"],
  ["iPhone 18 Pro 256 Glacier Esim + Sim", "iPhone 18 Pro 256 Glacier (SIM + ESIM)"],
  ["iPhone 17 Pro 256 Orange Esim (Active)", "iPhone 17 Pro 256 Orange (ESIM) (Active)"],
] as const) test(`warehouse SIM suffix matches rawNames: ${name}`, () => {
  products.getProductCache().clear();
  const cached = { ...product, rawNames: [rawName], attributes: { activated: rawName.includes("(Active)") } };
  products.setProductToCache(product.id, cached);
  const before = structuredClone(cached);
  const result = imports.ingestWarehousePrices([{ name, price: "250" }]);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].product.id, product.id);
  assert.equal(result.items[0].rawNameForMatch, rawName);
  assert.deepEqual(cached, before);
  assert.deepEqual(result.skipped, []);
});

test("warehouse SIM normalization does not guess other attributes or alter other products", () => {
  products.getProductCache().clear();
  products.setProductToCache(product.id, { ...product, rawNames: ["iPhone 17 Pro 256 Orange (ESIM)"] });
  const names = [
    "AirTag 2 (4pcs)", "MacBook Air 13 M5 24/512 Starlight",
    "iPhone 17 Pro 256 Orange Dual Sim", "iPhone 17 Pro 256 Orange",
    "iPhone 17 Pro 512 Orange Esim", "iPhone 17 Pro 256 White Esim",
    "iPhone 17 Pro 256 Orange Esim (Active)", "iPhone 17 Pro 256 Orange Esim unknown",
  ];
  const result = imports.ingestWarehousePrices(names.map(name => ({ name, price: "250" })));
  assert.deepEqual(result.items, []);
  assert.deepEqual(result.skipped[0].names, names);
  assert.equal(products.getProductCache().size, 1);
});

test("warehouse preserves direct rawName matches and merges equivalent SIM suffixes", () => {
  const name = product.rawNames[0].replace("(ESIM)", "Esim");
  const result = imports.ingestWarehousePrices([
    { name: product.rawNames[0], price: "250" }, { name, price: "240" },
  ]);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].price, "240");
  products.setProductToCache("direct", { ...product, id: "direct", rawNames: [name] });
  assert.equal(imports.ingestWarehousePrices([{ name, price: "200" }]).items[0].product.id, "direct");
});

test("keeps the smallest duplicate price and rejects missing/nonpositive/nonfinite prices", () => {
  const name = product.rawNames[0];
  const result = imports.ingestWarehousePrices([
    ...["", " ", "0", "-1", "NaN", "Infinity", "oops"].map(price => ({ name, price })),
    { name, price: "201.9" }, { name, price: "199.5" }, { name, price: "205" },
  ]);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].price, "199.5");
  assert.equal(result.skipped[0].names.length, 7);
});

test("warehouse snapshot preserves suppliers, is idempotent and clears disappeared items", async () => {
  catalog.upsertCatalog(product.id, "30000", "AAA-store");
  catalog.upsertCatalog(product.id, "290", "Today there tomorrow here");
  const result = imports.ingestWarehousePrices([{ name: product.rawNames[0], price: "250" }]);
  for (let i = 0; i < 2; i++) await handleIngestResult(bot, 10, result.items, "warehouse", 1);
  assert.equal(catalog.getCatalogItem(product.id)?.offers.length, 3);
  const updated = imports.ingestWarehousePrices([{ name: product.rawNames[0], price: "240" }]);
  await handleIngestResult(bot, 10, updated.items, "warehouse", 1);
  assert.equal(catalog.getCatalogItem(product.id)?.offers.find(o => o.source === "warehouse")?.price, "240");
  await handleIngestResult(bot, 10, [], "warehouse", 0);
  assert.deepEqual(catalog.getCatalogItem(product.id)?.offers.map(o => o.source), ["AAA-store", "Today there tomorrow here"]);
  assert.equal(saveCatalog.mock.callCount(), 4);
});

test("invalid and unmatched rows remove old warehouse offers without blocking good rows", async () => {
  products.setProductToCache("other", { ...product, id: "other", rawNames: ["other"] });
  catalog.upsertCatalog(product.id, "100", "warehouse");
  catalog.upsertCatalog("other", "120", "warehouse");
  const result = imports.ingestWarehousePrices([{ name: product.rawNames[0], price: "?" }, { name: "other", price: "110" }, { name: "unknown", price: "100" }]);
  await handleIngestResult(bot, 10, result.items, "warehouse", result.totalRows, { skipped: result.skipped });
  assert.equal(catalog.getCatalogItem(product.id), undefined);
  assert.equal(catalog.getCatalogItem("other")?.offers[0].price, "110");
  assert.ok(messages.some(text => text.includes("unknown")));
});

test("empty XLSX result retains its previous offers", async () => {
  catalog.upsertCatalog(product.id, "30000", "AAA-store");
  await handleIngestResult(bot, 10, [], "AAA-store", 0);
  assert.equal(catalog.getCatalogItem(product.id)?.offers[0].price, "30000");
  assert.equal(saveCatalog.mock.callCount(), 0);
});

test("saved warehouse offers load locally with the existing JSON schema", () => {
  catalog.upsertCatalog(product.id, "250.75", "warehouse");
  catalog.upsertCatalog(product.id, "30000", "AAA-store");
  saveCatalog.mock.restore();
  let saved = "";
  mock.method(fs, "writeFileSync", (path: any, data: any) => {
    assert.equal(path, "./data/catalog.json");
    saved = String(data);
  });
  catalog.saveCatalog();
  catalog.clearCatalogSource("warehouse");
  catalog.clearCatalogSource("AAA-store");
  mock.method(fs, "existsSync", (path: any) => {
    assert.equal(path, "./data/catalog.json");
    return true;
  });
  mock.method(fs, "readFileSync", (path: any) => {
    assert.equal(path, "./data/catalog.json");
    return saved;
  });
  catalog.loadCatalog();
  assert.deepEqual(catalog.getCatalogItem(product.id)?.offers, [
    { price: "250.75", source: "warehouse" }, { price: "30000", source: "AAA-store" },
  ]);
  assert.equal(getCatalogProductById(product.id, "wholesale")?.price, "310");
  assert.equal(sheetCalls.length, 0);
});

for (const [rub, usd, warehouse, source, price] of [
  [30000, 290, 250, "Today there tomorrow here", "300"],
  [20000, 290, 250, "AAA-store", "210"],
  [30000, 190, 250, "Today there tomorrow here", "200"],
  [25000, 250, 250, "AAA-store", "260"],
] as const) test(`minimum RUB=${rub}, USD=${usd}, warehouse=${warehouse}: ${source}`, () => {
  catalog.upsertCatalog(product.id, String(rub), "AAA-store");
  catalog.upsertCatalog(product.id, String(usd), "Today there tomorrow here");
  catalog.upsertCatalog(product.id, String(warehouse), "warehouse");
  const selected = getCatalogProducts({ role: "wholesale" })[0];
  assert.equal(selected.source, source);
  assert.equal(selected.price, price);
});

test("warehouse-only offers are retained in storage and excluded from priced views", () => {
  assert.equal(formatting.normalizeOfferPrice({ price: "250.4", source: "warehouse" }, rates), 250.4);
  assert.equal(formatting.toUsdPrice(250.4, rates, "warehouse"), 250.4);
  catalog.upsertCatalog(product.id, "250.4", "warehouse");
  assert.equal(catalog.getCatalogItem(product.id)?.offers[0].price, "250.4");
  for (const role of ["wholesale", "retail", "admin"] as const) {
    assert.equal(getCatalogProductById(product.id, role), undefined);
  }
});

test("invalid offers and unusable RUB conversion cannot win minimum selection", () => {
  catalog.upsertCatalog(product.id, "NaN", "Today there tomorrow here");
  catalog.upsertCatalog(product.id, "250", "warehouse");
  catalog.upsertCatalog(product.id, "10000", "AAA-store");
  mock.method(priceService, "getRates", () => ({ ...rates, rub_to_usd: 0 }));
  assert.deepEqual(getCatalogProducts({ role: "wholesale" }), []);
});

test("skipped report includes every name and respects Telegram limit", async () => {
  const names = Array.from({ length: 150 }, (_, i) => `missing-${i}: ${"x".repeat(70)}`);
  names.push("z".repeat(TELEGRAM_MESSAGE_LIMIT * 2 + 20));
  names.push("a".repeat(TELEGRAM_MESSAGE_LIMIT - 3)); // строка ровно в лимит
  names.push("b".repeat(TELEGRAM_MESSAGE_LIMIT + 20)); // после неё нельзя слать пустое сообщение
  await reports.sendIngestSkippedReport(bot, 10, [{ title: "Склад: не найдены", names }]);
  assert.ok(messages.length > 2);
  assert.ok(messages.every(text => text.length > 0 && text.length <= TELEGRAM_MESSAGE_LIMIT));
  const joined = messages.join("");
  for (const name of names) assert.ok(joined.includes(name));
});

test("warehouse reports show USD instead of unknown currency", async () => {
  catalog.upsertCatalog(product.id, "250", "Today there tomorrow here");
  await reports.sendHiddenProductsReport(bot, [{ ...getCatalogProducts()[0], source: "warehouse", hidden: true }]);
  assert.ok(messages.some(text => text.includes("250 USD")));
});

for (const [send, title] of [
  [reports.onAiError, ADMIN_TEXTS.AI_ERROR],
  [reports.onUnresolvedItems, ADMIN_TEXTS.DONT_RECOGNIZED],
] as const) test(`named admin report preserves heading, items, recipient and chunking: ${title}`, async () => {
  const sent = mock.method(bot, "sendMessage", async () => ({}));
  await send(bot, []);
  assert.equal(sent.mock.callCount(), 0);
  const names = Array.from({ length: 100 }, (_, i) => `item-${i} ${"x".repeat(100)}`);
  await send(bot, names);
  const calls = sent.mock.calls.map((call: any) => call.arguments);
  assert.ok(calls.length > 1);
  assert.ok(calls.every((args: any[]) => args[0] === 1 && args[1].length <= TELEGRAM_MESSAGE_LIMIT));
  assert.equal(calls.map((args: any[]) => args[1]).join(""),
    ADMIN_TEXTS.COUNTED_REPORT_HEADER(title, names.length) + names.map(ADMIN_TEXTS.REPORT_NAME_LINE).join(""));
});

test("AI cost report keeps four-decimal formatting and admin recipient", async () => {
  const sent = mock.method(bot, "sendMessage", async () => ({}));
  await reports.onCostReport(bot, 0.123456);
  assert.deepEqual(sent.mock.calls[0].arguments, [1, `${ADMIN_TEXTS.AI_COST}0.1235`]);
});

test("update button loads warehouse; failed read keeps saved warehouse prices", async () => {
  mock.method(sheets, "loadPricesFormats", async () => {});
  mock.method(sheets, "loadBrandsFromConfig", async () => {});
  mock.method(sheets, "loadColorsFromConfig", async () => {});
  mock.method(configReport, "sendConfigChangesReport", async () => {});
  sheetRows = [[product.rawNames[0], "", 1, 250]];
  registerCallbacks(bot);
  const query = { id: "q", data: CALLBACK_TYPE.RENEW_PRICE, from: { id: 10 }, message: { chat: { id: 10 } } };
  await handlers.callback_query(query);
  assert.equal(catalog.getCatalogItem(product.id)?.offers[0].price, "250");
  assert.ok(messages.some(text => text.includes("➕") && text.includes(product.name)));
  assert.equal(warehouseService.getWarehouse()[0].price, "250");
  const storedRows = warehouseService.getWarehouse();
  sheetError = new Error("Google unavailable");
  await handlers.callback_query(query);
  assert.equal(catalog.getCatalogItem(product.id)?.offers[0].price, "250");
  assert.deepEqual(warehouseService.getWarehouse(), storedRows);
  assert.equal(saveWarehouseFile.mock.callCount(), 1);
});

test("config loader persists filtered warehouse rows in memory/JSON including unmatched names", async () => {
  sheetRows = [[product.rawNames[0], "", 1, 250], ["unknown", "", 2, 100], ["zero", "", 0, 1]];
  await sheets.loadWarehouseFromConfig();
  const expected = [{ name: product.rawNames[0], price: "250" }, { name: "unknown", price: "100" }];
  assert.deepEqual(warehouseService.getWarehouse(), expected);
  assert.deepEqual(saveWarehouseFile.mock.calls[0].arguments, [WAREHOUSE_PATH, expected]);
  assert.equal(catalog.getCatalogItem(product.id)?.offers[0].price, "250");
  assert.deepEqual(warehouseService.getWarehouseIngestResult().skipped[0].names, ["unknown"]);
  const copy = warehouseService.getWarehouse();
  copy[0].price = "1";
  assert.equal(warehouseService.getWarehouse()[0].price, "250");
});

test("failed warehouse file write preserves previous memory and offers", async () => {
  await warehouseService.saveWarehouse([{ name: product.rawNames[0], price: "250" }]);
  mock.method(atomic, "writeJsonFileAtomic", () => { throw new Error("disk full"); });
  await assert.rejects(() => warehouseService.saveWarehouse([{ name: product.rawNames[0], price: "100" }]), /disk full/);
  assert.equal(warehouseService.getWarehouse()[0].price, "250");
  assert.equal(catalog.getCatalogItem(product.id)?.offers[0].price, "250");
});

test("startup restores warehouse JSON into memory and catalog without Google or writes", () => {
  catalog.upsertCatalog(product.id, "30000", "AAA-store");
  catalog.upsertCatalog(product.id, "500", "warehouse");
  mock.method(fs, "existsSync", (path: any) => { assert.equal(path, WAREHOUSE_PATH); return true; });
  mock.method(fs, "readFileSync", (path: any) => {
    assert.equal(path, WAREHOUSE_PATH);
    return JSON.stringify([{ name: product.rawNames[0], price: "250" }, { name: "unknown", price: "100" }]);
  });
  warehouseService.loadWarehouseFromFile();
  assert.equal(warehouseService.getWarehouse().length, 2);
  assert.equal(catalog.getCatalogItem(product.id)?.offers.find(o => o.source === "warehouse")?.price, "250");
  assert.equal(catalog.getCatalogItem(product.id)?.offers.length, 2);
  assert.equal(sheetCalls.length, 0);
  assert.equal(saveWarehouseFile.mock.callCount(), 0);
  assert.equal(saveCatalog.mock.callCount(), 0);
});

test("missing or corrupt warehouse file retains catalog; valid empty snapshot clears only warehouse", async () => {
  catalog.upsertCatalog(product.id, "250", "warehouse");
  catalog.upsertCatalog(product.id, "30000", "AAA-store");
  const missing = mock.method(fs, "existsSync", () => false);
  warehouseService.loadWarehouseFromFile();
  assert.equal(catalog.getCatalogItem(product.id)?.offers.length, 2);
  missing.mock.restore();
  await warehouseService.saveWarehouse([{ name: product.rawNames[0], price: "250" }]);
  mock.method(fs, "existsSync", () => true);
  const errors = mock.method(console, "error", () => {});
  const corrupted = mock.method(fs, "readFileSync", () => '[{"name": 3}]');
  warehouseService.loadWarehouseFromFile();
  assert.equal(errors.mock.callCount(), 1);
  assert.equal(warehouseService.getWarehouse()[0].price, "250");
  assert.equal(catalog.getCatalogItem(product.id)?.offers.length, 2);
  corrupted.mock.restore();
  mock.method(fs, "readFileSync", () => "[]");
  warehouseService.loadWarehouseFromFile();
  assert.deepEqual(catalog.getCatalogItem(product.id)?.offers.map(o => o.source), ["AAA-store"]);
});

test("warehouse change report shows additions, changed prices, removals and unchanged state", () => {
  const before = [{ productId: "a", name: "A", price: "250" }, { productId: "b", name: "B", price: "100" }];
  const after = [{ productId: "a", name: "A", price: "240" }, { productId: "c", name: "C", price: "150" }];
  const text = warehouseReport.buildWarehouseChangesMessages(before, after).join("\n");
  assert.ok(text.includes("➕ C — 150 USD"));
  assert.ok(text.includes("✏️ A — 250 → 240 USD"));
  assert.ok(text.includes("➖ B — 100 USD"));
  assert.ok(warehouseReport.buildWarehouseChangesMessages(after, after)[0].includes("Изменений нет"));
  const messages = warehouseReport.buildWarehouseChangesMessages([], Array.from({ length: 100 }, (_, i) => ({
    productId: String(i), name: `Product ${i} ${"📦".repeat(4000)}`, price: "250",
  })));
  assert.ok(messages.length > 1);
  assert.ok(messages.every(text => text.length > 0 && text.length <= TELEGRAM_MESSAGE_LIMIT));
});

for (const input of ["button", "text"]) test(`catalog → cart (${input}) → order retains price/source without recalculation`, async () => {
  catalog.upsertCatalog(product.id, "200", "warehouse");
  catalog.upsertCatalog(product.id, "250", "Today there tomorrow here");
  const selected = getCatalogProductById(product.id, "wholesale")!;
  assert.equal(selected.price, "260");
  setChatState(10, { mode: "amount_product_for_cart", sections: { [SECTION.CART]: { flowStep: "amount", selectedProductId: product.id, currentOrder: [] } } as any });
  registerCallbacks(bot);
  if (input === "button") {
    await handlers.callback_query({ id: "q", data: `${CALLBACK_TYPE.CHOOSING_AMOUNT}::2`, from: { id: 10 }, message: { chat: { id: 10 } } });
  } else {
    registerMessages(bot);
    await handlers.message({ chat: { id: 10 }, text: "2", message_id: 99 });
  }
  const cart = getChatState(10).sections.cart!.currentOrder!;
  assert.equal(cart[0].price, "260");
  assert.equal(cart[0].source, "Today there tomorrow here");
  catalog.upsertCatalog(product.id, "500", "Today there tomorrow here");
  let saved: any;
  mock.method(orders, "addOrder", (order: Order) => { saved = order; });
  await handlers.callback_query({ id: "q2", data: CALLBACK_TYPE.SUBMIT_ORDER, from: { id: 10, first_name: "Test" }, message: { chat: { id: 10 } } });
  assert.equal(saved.total, 520);
  assert.equal(saved.items[0].source, "Today there tomorrow here");
  assert.ok(messages.some(text => text.includes("260 = 520")));
});

function workbook(rows: unknown[][]): Buffer {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), "test");
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" });
}

for (const manager of ["manager_retail", "manager_wholesale"] as const) {
  for (const source of ["AAA-store", "Today there tomorrow here"] as const) {
    test(`${manager} inherits client pricing for ${source}`, () => {
      catalog.upsertCatalog(product.id, source === "AAA-store" ? "25040" : "250.4", source);
      const parent = roleUtils.getPricingRole(manager);
      assert.equal(getCatalogProducts({ role: manager })[0].price, getCatalogProducts({ role: parent })[0].price);
      mock.method(users, "getUserRole", () => manager);
      assert.equal(priceService.getCurrency(10), manager === "manager_retail" ? "BYN" : "USD");
      assert.equal(formatting.findPriceRule(250.4, product.category, product.brand, manager, priceService.getPriceFormation()), manager === "manager_retail" ? 20 : 10);
    });
  }
}

for (const role of ["retail", "wholesale", "manager_retail", "manager_wholesale", "admin", "superadmin", undefined] as const) {
  test(`warehouse legend visibility for ${role} in Apple smartphones`, async () => {
    const { CATALOG_TEXTS } = require("../src/texts") as typeof import("../src/texts");
    const { renderProductsList } = require("../src/render/renderProductsList") as typeof import("../src/render/renderProductsList");
    mock.method(users, "getUserRole", () => role);
    catalog.upsertCatalog(product.id, "250", "Today there tomorrow here");
    setChatState(10, { section: SECTION.CATALOG, sections: {
      [SECTION.CATALOG]: { flowStep: "products", selectedBrand: "Apple", selectedCategory: "Смартфоны" },
    } });
    const screen = mock.method(screens, "renderScreen", async () => {});
    await renderProductsList(bot, 10);
    const options = screen.mock.calls[screen.mock.calls.length - 1].arguments[2];
    assert.ok(options);
    const legend = options.text;
    assert.ok(legend.startsWith(CATALOG_TEXTS.SIM_LEGEND));
    assert.equal(legend.includes(CATALOG_TEXTS.WAREHOUSE_LEGEND), role !== "retail" && role !== undefined);
  });

  test(`warehouse indication for ${role} uses availability independently of cheapest source`, () => {
    catalog.upsertCatalog(product.id, "250", "Today there tomorrow here");
    catalog.upsertCatalog(product.id, "200", "warehouse");
    const selected = getCatalogProducts({ role })[0];
    const visible = role !== "retail" && role !== undefined;
    assert.equal(selected.source, "Today there tomorrow here");
    assert.equal(selected.price, role === "retail" || role === "manager_retail" ? "810" :
      role === "wholesale" || role === "manager_wholesale" ? "260" : "250");
    assert.equal(selected.inWarehouse === true, visible);
    const text = messageUtils.buildMessagesForProducts([selected], role).map(m => m.text).join("\n");
    assert.equal(text.includes(ITEM_TEXTS.IN_WAREHOUSE), visible);
    if (role === "retail" || role === "manager_retail") assert.ok(text.includes(`${selected.price}р.`));
    // Даже переданный извне флаг не должен раскрывать склад розничному клиенту.
    assert.equal(roleUtils.getWarehouseMarker({ inWarehouse: true }, role).length > 0, visible);
    catalog.clearCatalogSource("warehouse");
    const absent = getCatalogProducts({ role })[0];
    assert.equal(messageUtils.buildMessagesForProducts([absent], role)[0].text.includes(ITEM_TEXTS.IN_WAREHOUSE), false);
  });
}

function loadTestUsers(list: { id: number; role: UserRole }[]) {
  const exists = mock.method(fs, "existsSync", () => true);
  const read = mock.method(fs, "readFileSync", () => JSON.stringify(list));
  users.loadUsers();
  read.mock.restore();
  exists.mock.restore();
}

function lastArgs(spy: any): any[] {
  return spy.mock.calls[spy.mock.calls.length - 1].arguments;
}

for (const superAdmin of [false, true]) {
  test(`manager roles are offered by add/edit keyboards for ${superAdmin ? "superadmin" : "admin"}`, () => {
    for (const keyboard of [addUsers.addUserRoleKeyboard(superAdmin), editUsers.editUserRoleKeyboard(superAdmin)]) {
      const values = keyboard.flat().map(button => button.callback_data!);
      assert.ok(values.some(value => value.endsWith("::manager_retail")));
      assert.ok(values.some(value => value.endsWith("::manager_wholesale")));
      assert.equal(values.some(value => value.endsWith("::superadmin")), superAdmin);
    }
  });
  for (const role of ["manager_retail", "manager_wholesale"] as const) {
    for (const mode of ["add", "edit"] as const) {
      test(`${superAdmin ? "superadmin" : "admin"} can ${mode} ${role} via user workflow and persist role`, async () => {
        loadTestUsers([{ id: 10, role: superAdmin ? "superadmin" : "admin" }, ...(mode === "edit" ? [{ id: 20, role: "retail" as const }] : [])]);
        mock.method(users, "getUser", actualUsers.getUser);
        mock.method(users, "isSuperAdmin", () => superAdmin);
        if (mode === "add") {
          await adminService.addUser(bot, 10);
          await addUsers.addUserInputHandler(bot, 10, "20");
        } else {
          await adminService.editUser(bot, 10);
          await editUsers.editUserInputHandler(bot, 10, "20");
        }
        registerCallbacks(bot);
        const action = mode === "add" ? CALLBACK_TYPE.ROLE_FOR_NEW_USER : CALLBACK_TYPE.NEW_ROLE_FOR_EXIST_USER;
        await handlers.callback_query({ id: "q", data: `${action}::${role}`, from: { id: 10 }, message: { chat: { id: 10 } } });
        assert.equal(actualUsers.getUserRole(20), role);
        assert.equal(actualUsers.isAdmin(20), false);
        const persisted = lastArgs(saveWarehouseFile)[1];
        assert.equal(persisted.find((user: any) => user.id === 20).role, role);
        loadTestUsers(persisted);
        assert.equal(actualUsers.getUserRole(20), role);
      });
    }
  }
}

for (const action of [CALLBACK_TYPE.ROLE_FOR_NEW_USER, CALLBACK_TYPE.NEW_ROLE_FOR_EXIST_USER]) {
  test(`manager cannot forge user role change: ${action}`, async () => {
    loadTestUsers([{ id: 10, role: "manager_wholesale" }, { id: 20, role: "retail" }]);
    mock.method(users, "isAdmin", actualUsers.isAdmin);
    setChatState(10, { sections: { [SECTION.ADMIN_PANEL]: { flowStep: action === CALLBACK_TYPE.ROLE_FOR_NEW_USER ? "add_user" : "edit_user", users: { newUserId: 30, editingUserId: 20 } } } as any });
    registerCallbacks(bot);
    await handlers.callback_query({ id: "q", data: `${action}::manager_retail`, from: { id: 10 }, message: { chat: { id: 10 } } });
    assert.equal(actualUsers.getUserRole(20), "retail");
    assert.equal(actualUsers.getUserRole(30), undefined);
    assert.equal(saveWarehouseFile.mock.callCount(), 0);
  });
  test(`unknown/admin roles cannot bypass admin role picker: ${action}`, async () => {
    loadTestUsers([{ id: 10, role: "admin" }, { id: 20, role: "retail" }]);
    setChatState(10, { sections: { [SECTION.ADMIN_PANEL]: { flowStep: action === CALLBACK_TYPE.ROLE_FOR_NEW_USER ? "add_user" : "edit_user", users: { newUserId: 30, editingUserId: 20 } } } as any });
    registerCallbacks(bot);
    for (const role of ["admin", "superadmin", "not-a-role"]) {
      await handlers.callback_query({ id: "q", data: `${action}::${role}`, from: { id: 10 }, message: { chat: { id: 10 } } });
    }
    assert.equal(actualUsers.getUserRole(20), "retail");
    assert.equal(actualUsers.getUserRole(30), undefined);
    assert.equal(saveWarehouseFile.mock.callCount(), 0);
  });
}

for (const role of ["manager_retail", "manager_wholesale"] as const) {
  test(`${role} sees warehouse in product/cart screens without changing stored cart price`, async () => {
    mock.method(users, "getUserRole", () => role);
    catalog.upsertCatalog(product.id, "20000", "AAA-store");
    catalog.upsertCatalog(product.id, "250", "warehouse");
    const entry = { ...getCatalogProductById(product.id, role)!, price: "123", amount: 1 };
    const screen = mock.method(screens, "renderScreen", async () => {});
    for (const step of ["products_for_cart", "amount", "main", "edit_cart", "edit_product_in_cart"] as const) {
      setChatState(10, { section: SECTION.CART, sections: { [SECTION.CART]: {
        flowStep: step, currentOrder: [entry], selectedProductId: product.id, selectedProductIdForCart: product.id,
        selectedBrand: product.brand, selectedCategory: product.category, selectedModel: product.model, selectedStorage: product.attributes?.storage,
      } } as any });
      await actualRenderFlow(bot, 10);
      assert.ok(lastArgs(screen)[2].text.split("\n").some((line: string) => line.endsWith(` ${ITEM_TEXTS.IN_WAREHOUSE}`)));
    }
    catalog.clearCatalogSource("warehouse");
    setChatState(10, { sections: { [SECTION.CART]: { flowStep: "main", currentOrder: [entry] } } as any });
    await actualRenderFlow(bot, 10);
    const text = lastArgs(screen)[2].text;
    assert.equal(text.includes(`</i> ${ITEM_TEXTS.IN_WAREHOUSE}`), false);
    assert.ok(text.includes("123"));
    assert.equal(getChatState(10).sections.cart?.currentOrder?.[0].price, "123");
  });
  test(`${role} inherits manager contact link and has a readable order label`, async () => {
    mock.method(users, "getUser", () => ({ id: 10, role }));
    mock.method(users, "getUserRole", () => role);
    const send = mock.method(bot, "sendMessage", async () => ({}));
    registerMessages(bot);
    await handlers.message({ chat: { id: 10 }, text: MENU_TEXTS.MANAGER, message_id: 1 });
    assert.equal(lastArgs(send)[2].reply_markup.inline_keyboard[0][0].url,
      role === "manager_retail" ? "https://retail.example" : "https://wholesale.example");
    const order = orders.createOrder({ id: 10, first_name: "Manager", is_bot: false }, []);
    assert.ok(orders.buildOrderMessage(order, 10).includes(role === "manager_retail" ? "Менеджер розницы" : "Менеджер опта"));
  });
}

test("AAA XLSX regression: cached rawName and RUB price remain unchanged", async () => {
  catalog.upsertCatalog(product.id, "500", "warehouse");
  catalog.upsertCatalog(product.id, "510", "Today there tomorrow here");
  mock.method(brands, "resolveBrandFromName", () => "Apple");
  const result = await imports.ingestAAAStorePrice(workbook([
    ["SKU", "Категория", "Название", "Модель", "Цена", "Тип SIM"],
    ["sku", "Смартфоны", product.name, product.model, 30000, "ESIM"],
  ]));
  assert.equal(result.items[0].product.id, product.id);
  assert.equal(result.items[0].price, "30000");
  await handleIngestResult(bot, 10, result.items, "AAA-store", result.totalRows);
  assert.equal(getCatalogProducts({ role: "wholesale" })[0].price, "310");
  assert.equal(catalog.getCatalogItem(product.id)?.offers.length, 3);
});

test("second XLSX regression: cached rawName, USD rounding and +5 delivery", async () => {
  catalog.upsertCatalog(product.id, "500", "warehouse");
  catalog.upsertCatalog(product.id, "51000", "AAA-store");
  mock.method(brands, "extractBrandFromStart", () => ({ brand: "Apple", nameWithoutBrand: product.rawNames[0] }));
  const result = await imports.ingestTodayThereTomorrowHerePrice(workbook([
    ["Название", "Цена"], [product.rawNames[0], 250.4],
  ]));
  assert.equal(result.items[0].product.id, product.id);
  assert.equal(result.items[0].price, "255");
  await handleIngestResult(bot, 10, result.items, "Today there tomorrow here", result.totalRows);
  assert.equal(getCatalogProducts({ role: "wholesale" })[0].price, "265");
  assert.equal(catalog.getCatalogItem(product.id)?.offers.length, 3);
});

test("iPhone Air/Duo sort together and form separate messages despite legacy model strings", () => {
  products.getProductCache().clear();
  mock.method(colors, "removeColorFromName", (name: string) => name.replace(/\bblack\b/gi, ""));
  const fixtures = [
    { id: "duo-short", name: "iPhone Duo 256 NightSky", model: "Duo", category: "Смартфоны" },
    { id: "air-short", name: "iPhone Air 512 Black", model: "Air", category: "Смартфоны" },
    { id: "14", name: "iPhone 14 128 Black", model: "iPhone 14", category: "Смартфоны" },
    { id: "duo-old", name: "iPhone Duo 512 Star White", model: "iPhone Duo 512 Star White", category: "Аксессуары" },
    { id: "18", name: "iPhone 18 256 Black", model: "iPhone 18", category: "Смартфоны" },
    { id: "air", name: "iPhone Air 256 Black", model: "iPhone Air", category: "Смартфоны" },
    { id: "duo", name: "iPhone Duo 256 Night Sky", model: "iPhone Duo", category: "Смартфоны" },
  ];
  for (const item of fixtures) {
    products.setProductToCache(item.id, { ...product, ...item });
    catalog.upsertCatalog(item.id, "250", "Today there tomorrow here");
  }
  const sorted = getCatalogUIProducts({ brand: "Apple", category: "Смартфоны" }, "wholesale");
  const parts = messageUtils.buildMessagesForProducts(sorted, "wholesale");
  assert.deepEqual(parts.map(part => iphoneModels.getIphoneGroupKey(part.products[0])), ["14", "18", "air", "duo"]);
  for (const part of parts) assert.equal(new Set(part.products.map(iphoneModels.getIphoneGroupKey)).size, 1);
  assert.equal(parts.flatMap(part => part.products).length, fixtures.length);
  assert.equal(getCatalogUIProducts({ category: "Аксессуары" }, "wholesale").length, 0);
});

test("named family boundaries remain correct at message length splits and unknown models", () => {
  const air = { ...product, price: "250", model: "Air", name: "iPhone Air 256 Black" };
  const duo = { ...air, model: "Duo", name: "iPhone Duo 256 Night Sky" };
  const entries = [...Array.from({ length: 200 }, (_, i) => ({ ...air, id: `air-${i}` })), duo];
  const parts = messageUtils.buildMessagesForProducts(entries, "wholesale");
  assert.ok(parts.length > 2);
  assert.ok(parts.every(part => part.text.length <= TELEGRAM_MESSAGE_LIMIT));
  assert.ok(parts.every(part => new Set(part.products.map(iphoneModels.getIphoneGroupKey)).size === 1));
  assert.equal(parts.flatMap(part => part.products).length, entries.length);
  const unknown = { ...air, name: "Unknown", model: "Unknown" };
  assert.equal(messageUtils.buildMessagesForProducts([air, unknown, duo]).length, 3);
});

test("numeric iPhone generations and Samsung letter groups retain previous grouping", () => {
  const entries = [
    { ...product, price: "250", name: "iPhone 16e 128 Black", model: "iPhone 16e" },
    { ...product, price: "250", name: "iPhone 16 Pro 128 Black", model: "iPhone 16 Pro" },
    { ...product, price: "250", name: "iPhone 17 256 Black", model: "iPhone 17" },
  ];
  assert.deepEqual(messageUtils.buildMessagesForProducts(entries).map(part => part.products.length), [2, 1]);
  const samsung = entries.map((item, index) => ({ ...item, brand: "Samsung", model: index < 2 ? `A${index + 25}` : "S25" }));
  assert.deepEqual(messageUtils.buildMessagesForProducts(samsung).map(part => part.products.length), [2, 1]);
});

test("old Duo accessory card is corrected in catalog without changing cache, ID or offers", () => {
  const cached = { ...product, category: "Аксессуары", model: "iPhone Duo 256 Star White", name: "iPhone Duo 256 Star White" };
  products.setProductToCache(product.id, cached);
  catalog.upsertCatalog(product.id, "30000", "AAA-store");
  mock.method(priceService, "getPriceFormation", () => [
    { category: "Смартфоны", prices: [{ type: "wholesale", value: 10 }] },
    { category: "Аксессуары", prices: [{ type: "wholesale", value: 99 }] },
  ]);
  const displayed = getCatalogProducts({ role: "wholesale" })[0];
  assert.equal(displayed.category, "Смартфоны");
  assert.equal(displayed.model, "iPhone Duo");
  assert.equal(displayed.price, "310");
  assert.equal(displayed.id, product.id);
  assert.equal(cached.category, "Аксессуары");
  assert.equal(catalog.getCatalogItem(product.id)?.offers[0].price, "30000");
});

for (const name of ["Apple iPhone Duo 256 Night Sky", "Apple iPhone Duo 512 Star White"]) {
  test(`AAA import corrects named phone category/model: ${name}`, async () => {
    products.getProductCache().clear();
    mock.method(brands, "resolveBrandFromName", () => "Apple");
    const result = await imports.ingestAAAStorePrice(workbook([
      ["SKU", "Категория", "Название", "Модель", "Цена", "Тип SIM"],
      ["duo", "Аксессуары", name, name, 30000, "ESIM"],
    ]));
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].product.category, "Смартфоны");
    assert.equal(result.items[0].product.model, "iPhone Duo");
    assert.equal(result.items[0].price, "30000");
  });
  test(`second import recognizes Duo as smartphone rather than accessory: ${name}`, async () => {
    products.getProductCache().clear();
    mock.method(brands, "extractBrandFromStart", () => ({ brand: "Apple", nameWithoutBrand: name.replace(/^Apple /, "") }));
    mock.method(ai, "extractModelOnly", async () => ({ model: "Duo", cost: null }));
    const result = await imports.ingestTodayThereTomorrowHerePrice(workbook([
      ["Название", "Цена"], [name + " (ESIM)", 250],
    ]));
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].product.category, "Смартфоны");
    assert.equal(result.items[0].product.model, "iPhone Duo");
    assert.equal(result.items[0].price, "255");
  });
}

test("Duo accessories and unrelated Apple products remain accessories", async () => {
  products.getProductCache().clear();
  mock.method(brands, "resolveBrandFromName", () => "Apple");
  for (const name of ["Apple iPhone Duo 256 Night Sky Case Kit", "Apple MagSafe Duo Charger"]) {
    assert.equal(iphoneModels.getNamedIphoneDeviceModel(name), undefined);
    const result = await imports.ingestAAAStorePrice(workbook([
      ["SKU", "Категория", "Название", "Модель", "Цена"],
      ["accessory", "Аксессуары", name, name, 1000],
    ]));
    assert.equal(result.items[0].product.category, "Аксессуары");
    catalog.upsertCatalog(result.items[0].product.id, result.items[0].price, "AAA-store");
  }
  assert.equal(getCatalogProducts().length, 2);
  assert.ok(getCatalogProducts().every(item => item.category === "Аксессуары"));
});

function warehouseAppleRecognition() {
  mock.method(brands, "resolveBrandFromName", (name: string) => /^(?:Apple |iPhone |MacBook |AirTag )/i.test(name) ? "Apple" : undefined);
  mock.method(colors, "resolveColorFromName", (name: string) => {
    if (/black/i.test(name)) return "Black";
    if (/white/i.test(name)) return "White";
    if (/starlight/i.test(name)) return "Starlight";
    return undefined;
  });
}

test("warehouse stages new iPhone, persists product, and retains USD without delivery on duplicate rows", async () => {
  products.getProductCache().clear();
  warehouseAppleRecognition();
  const model = mock.method(ai, "extractModelOnly", async () => ({ model: "iPhone 17 Pro", cost: 0.01 }));
  const saved = mock.method(products, "saveProductCache", () => {});
  const rows = [{ name: "Apple iPhone 17 Pro 256 Black Esim", price: "500" }, { name: "iPhone 17 Pro 256 Black (ESIM)", price: "450" }];
  const plan = await imports.ingestWarehouseProducts(rows);
  assert.equal(products.getProductCache().size, 0);
  assert.equal(plan.cacheUpdates.length, 1);
  assert.equal(plan.items[0].isNew, true);
  assert.equal(plan.items[0].price, "450");
  model.mock.resetCalls();
  await warehouseService.saveWarehouse(rows);
  assert.equal(products.getProductCache().size, 1);
  assert.equal(saved.mock.callCount(), 1);
  assert.equal(model.mock.callCount(), 1);
  const created = products.getProductCacheValues()[0];
  assert.equal(created.model, "iPhone 17 Pro");
  assert.equal(created.attributes?.sim, "ESIM");
  assert.equal(created.attributes?.color, "Black");
  assert.equal(catalog.getCatalogItem(created.id)?.offers[0].price, "450");
  assert.equal(warehouseService.getWarehouseIngestResult().aiCost, 0.01);
  await warehouseService.saveWarehouse(rows);
  assert.equal(products.getProductCache().size, 1);
  assert.equal(model.mock.callCount(), 1);
  assert.equal(saved.mock.callCount(), 1);
  assert.equal(warehouseService.getWarehouseIngestResult().items[0].isNew, false);
});

test("warehouse creates regional MacBooks separately and keeps region aliases", async () => {
  products.getProductCache().clear();
  warehouseAppleRecognition();
  mock.method(ai, "callAIForProduct", async () => ({ result: { status: "ok", confidence: 0.95, model: "MacBook Air 13 M5", color: "Starlight" }, cost: 0.02 }));
  const rows = [{ name: "Apple MacBook Air 13 M5 24/512 Starlight 🇪🇺", price: "900" },
    { name: "MacBook Air 13 M5 24/512 Starlight 🇺🇸", price: "800" }];
  await warehouseService.saveWarehouse(rows);
  const created = products.getProductCacheValues();
  assert.equal(created.length, 2);
  assert.deepEqual(created.map(p => p.attributes?.country), ["🇪🇺", "🇺🇸"]);
  assert.notEqual(created[0].id, created[1].id);
  assert.equal(imports.ingestWarehousePrices(rows).items.length, 2);
  assert.ok(created.every(p => p.rawNames.every(raw => /🇪🇺|🇺🇸/u.test(raw))));
});

test("new warehouse phones do not merge SIM, colors or activation", async () => {
  products.getProductCache().clear();
  warehouseAppleRecognition();
  mock.method(ai, "extractModelOnly", async () => ({ model: "iPhone 17 Pro", cost: null }));
  await warehouseService.saveWarehouse([
    { name: "iPhone 17 Pro 256 Black Esim", price: "500" },
    { name: "iPhone 17 Pro 256 Black Dual Sim", price: "510" },
    { name: "iPhone 17 Pro 256 White Esim", price: "520" },
    { name: "iPhone 17 Pro 256 Black Esim (Active)", price: "490" },
  ]);
  assert.equal(products.getProductCache().size, 4);
  assert.equal(catalog.getCatalog().length, 4);
  assert.equal(products.getProductCacheValues().filter(p => p.attributes?.activated).length, 1);
});

test("iPhone flags use existing SIM rules and do not create country-specific iPhone duplicates", async () => {
  products.getProductCache().clear();
  warehouseAppleRecognition();
  const model = mock.method(ai, "extractModelOnly", async () => ({ model: "iPhone 17 Pro", cost: null }));
  await warehouseService.saveWarehouse([
    { name: "Apple iPhone 17 Pro 256 Black 🇺🇸", price: "500" },
    { name: "iPhone 17 Pro 256 Black 🇯🇵", price: "490" },
  ]);
  assert.equal(products.getProductCache().size, 1);
  const created = products.getProductCacheValues()[0];
  assert.equal(created.attributes?.country, undefined);
  assert.equal(created.attributes?.sim, "ESIM");
  assert.equal(catalog.getCatalogItem(created.id)?.offers[0].price, "490");
  assert.equal(model.mock.callCount(), 1);
});

test("AirTag package becomes new accessory without AI and retains package distinction", async () => {
  products.getProductCache().clear();
  warehouseAppleRecognition();
  const aiCalls = mock.method(ai, "callAIForProduct", async () => { throw new Error("must not be called"); });
  await warehouseService.saveWarehouse([{ name: "AirTag 2 (4pcs)", price: "80" }, { name: "AirTag 2 (1pcs)", price: "25" }]);
  assert.equal(products.getProductCache().size, 2);
  assert.ok(products.getProductCacheValues().every(p => p.category === "Аксессуары"));
  assert.equal(aiCalls.mock.callCount(), 0);
});

test("warehouse uses generic existing extractor for non-Apple category and model", async () => {
  products.getProductCache().clear();
  mock.method(brands, "resolveBrandFromName", () => "Samsung");
  mock.method(colors, "resolveColorFromName", () => "Black");
  mock.method(ai, "callAIForProduct", async () => ({ result: { status: "ok", confidence: 0.95, category: "Смартфоны", model: "Galaxy S25", color: "Black" }, cost: 0.01 }));
  await warehouseService.saveWarehouse([{ name: "Samsung Galaxy S25 256 Black 🇪🇺", price: "500" }]);
  const created = products.getProductCacheValues()[0];
  assert.equal(created.brand, "Samsung");
  assert.equal(created.category, "Смартфоны");
  assert.equal(created.attributes?.country, "🇪🇺");
});

test("structural match reuses supplier ID after model extraction, preserving supplier offer", async () => {
  warehouseAppleRecognition();
  mock.method(ai, "extractModelOnly", async () => ({ model: "iPhone 17", cost: null }));
  catalog.upsertCatalog(product.id, "30000", "AAA-store");
  await warehouseService.saveWarehouse([{ name: "Apple iPhone 17 256 Black Esim", price: "250" }]);
  assert.equal(products.getProductCache().size, 1);
  assert.equal(warehouseService.getWarehouseIngestResult().items[0].product.id, product.id);
  assert.equal(warehouseService.getWarehouseIngestResult().items[0].isNew, false);
  assert.deepEqual(catalog.getCatalogItem(product.id)?.offers.map(o => o.source), ["AAA-store", "warehouse"]);
});

test("partial creation failures and missing attributes do not block valid accessories", async () => {
  products.getProductCache().clear();
  warehouseAppleRecognition();
  mock.method(ai, "extractModelOnly", async () => { throw new Error("simulated AI failure"); });
  await warehouseService.saveWarehouse([
    { name: "unknown", price: "10" },
    { name: "iPhone 17 256 Black", price: "500" },
    { name: "iPhone 17 256 Black Esim", price: "500" },
    { name: "AirTag 2 (4pcs)", price: "80" },
    { name: "AirTag 2 (1pcs)", price: "not a price" },
  ]);
  assert.equal(products.getProductCache().size, 1);
  assert.equal(warehouseService.getWarehouseIngestResult().items.length, 1);
  const rejected = warehouseService.getWarehouseIngestResult().skipped.flatMap(group => group.names);
  assert.equal(rejected.length, 4);
  assert.ok(rejected.includes("unknown"));
  assert.ok(rejected.includes("iPhone 17 256 Black"));
});

test("Duo creation keeps explicit previously unknown colors from extraction", async () => {
  products.getProductCache().clear();
  warehouseAppleRecognition();
  mock.method(colors, "resolveColorFromName", () => undefined);
  mock.method(ai, "callAIForProduct", async (name: string) => ({ result: {
    status: "ok", confidence: 0.95, model: "iPhone Duo", color: name.includes("Night") ? "Night Sky" : "Star White",
  }, cost: 0.01 }));
  await warehouseService.saveWarehouse([{ name: "iPhone Duo 256 NightSky Esim", price: "600" }, { name: "iPhone Duo 256 Star White Esim", price: "610" }]);
  assert.equal(products.getProductCache().size, 2);
  assert.deepEqual(products.getProductCacheValues().map(p => p.attributes?.color), ["Night Sky", "Star White"]);
});

test("warehouse write failure does not publish or persist newly staged products", async () => {
  products.getProductCache().clear();
  warehouseAppleRecognition();
  const persist = mock.method(products, "saveProductCache", () => {});
  mock.method(atomic, "writeJsonFileAtomic", () => { throw new Error("disk full"); });
  await assert.rejects(warehouseService.saveWarehouse([{ name: "AirTag 2 (4pcs)", price: "80" }]), /disk full/);
  assert.equal(products.getProductCache().size, 0);
  assert.equal(persist.mock.callCount(), 0);
  assert.deepEqual(warehouseService.getWarehouse(), []);
});

test("product cache write failure restores memory and leaves catalog unchanged", async () => {
  products.getProductCache().clear();
  warehouseAppleRecognition();
  mock.method(products, "saveProductCache", () => { throw new Error("product cache write failed"); });
  await assert.rejects(warehouseService.saveWarehouse([{ name: "AirTag 2 (4pcs)", price: "80" }]), /product cache write failed/);
  assert.equal(products.getProductCache().size, 0);
  assert.deepEqual(catalog.getCatalog(), []);
  assert.deepEqual(warehouseService.getWarehouse(), []);
});

test("queued warehouse updates do not create the same product twice", async () => {
  products.getProductCache().clear();
  warehouseAppleRecognition();
  const persist = mock.method(products, "saveProductCache", () => {});
  await Promise.all([
    warehouseService.saveWarehouse([{ name: "AirTag 2 (4pcs)", price: "80" }]),
    warehouseService.saveWarehouse([{ name: "AirTag 2 (4pcs)", price: "70" }]),
  ]);
  assert.equal(products.getProductCache().size, 1);
  assert.equal(persist.mock.callCount(), 1);
  const created = products.getProductCacheValues()[0];
  assert.equal(catalog.getCatalogItem(created.id)?.offers[0].price, "70");
});

test("warehouse startup never creates missing products or calls AI", () => {
  products.getProductCache().clear();
  warehouseAppleRecognition();
  const aiCalls = mock.method(ai, "callAIForProduct", async () => { throw new Error("forbidden"); });
  mock.method(fs, "existsSync", () => true);
  mock.method(fs, "readFileSync", () => JSON.stringify([{ name: "AirTag 2 (4pcs)", price: "80" }]));
  warehouseService.loadWarehouseFromFile();
  assert.equal(products.getProductCache().size, 0);
  assert.equal(aiCalls.mock.callCount(), 0);
  assert.deepEqual(catalog.getCatalog(), []);
  assert.deepEqual(warehouseService.getWarehouseIngestResult().skipped[0].names, ["AirTag 2 (4pcs)"]);
});

test("creation triggered by update button reports AI cost using existing admin report", async () => {
  products.getProductCache().clear();
  warehouseAppleRecognition();
  mock.method(ai, "extractModelOnly", async () => ({ model: "iPhone 17", cost: 0.02 }));
  mock.method(sheets, "loadPricesFormats", async () => {});
  mock.method(sheets, "loadBrandsFromConfig", async () => {});
  mock.method(sheets, "loadColorsFromConfig", async () => {});
  mock.method(configReport, "sendConfigChangesReport", async () => {});
  sheetRows = [["iPhone 17 256 Black Esim", "", 1, 250]];
  registerCallbacks(bot);
  await handlers.callback_query({ id: "q", data: CALLBACK_TYPE.RENEW_PRICE, from: { id: 10 }, message: { chat: { id: 10 } } });
  assert.equal(products.getProductCache().size, 1);
  assert.ok(messages.includes(`${ADMIN_TEXTS.AI_COST}0.0200`));
});

test("uncertain model/category or hallucinated color does not create warehouse cards", async () => {
  products.getProductCache().clear();
  warehouseAppleRecognition();
  mock.method(colors, "resolveColorFromName", () => undefined);
  mock.method(ai, "extractModelOnly", async () => ({ model: "iPhone 17", cost: null }));
  mock.method(ai, "callAIForProduct", async () => ({ result: { status: "ok", confidence: 0.95, model: "iPhone 17", color: "Purple" }, cost: 0.01 }));
  await warehouseService.saveWarehouse([{ name: "iPhone 17 256 Black Esim", price: "250" }]);
  assert.equal(products.getProductCache().size, 0);
  assert.ok(warehouseService.getWarehouseIngestResult().skipped.some(group => group.title === ADMIN_TEXTS.WAREHOUSE_MISSING_ATTRIBUTES));
  mock.method(ai, "callAIForProduct", async () => ({ result: { status: "low_confidence", confidence: 0.3, model: "MacBook Air", color: "Starlight" }, cost: 0.02 }));
  await warehouseService.saveWarehouse([{ name: "MacBook Air 13 M5 24/512 Starlight 🇪🇺", price: "900" }]);
  assert.equal(products.getProductCache().size, 0);
  assert.equal(warehouseService.getWarehouseIngestResult().aiCost, 0.02);
});

test("legacy regionless alias cannot attach a different region to supplier product", async () => {
  products.getProductCache().clear();
  warehouseAppleRecognition();
  const name = "MacBook Air 13 M5 24/512 Starlight";
  products.setProductToCache("supplier-eu", { ...product, id: "supplier-eu", category: "Ноутбуки", model: "MacBook Air 13 M5", name,
    rawNames: [name, name + " 🇪🇺"], attributes: { storage: "512 GB", color: "Starlight", country: "🇪🇺" } });
  mock.method(ai, "callAIForProduct", async () => ({ result: { status: "ok", confidence: 0.95, model: "MacBook Air 13 M5", color: "Starlight" }, cost: null }));
  await warehouseService.saveWarehouse([{ name, price: "900" }, { name: name + " 🇺🇸", price: "850" }]);
  assert.equal(products.getProductCache().size, 3);
  assert.equal(catalog.getCatalogItem("supplier-eu"), undefined);
  assert.deepEqual(new Set(products.getProductCacheValues().map(p => p.attributes?.country)), new Set(["🇪🇺", undefined, "🇺🇸"]));
});

test("later recognized alias resolves earlier row failure without a contradictory skip report", async () => {
  products.getProductCache().clear();
  warehouseAppleRecognition();
  const model = mock.method(ai, "extractModelOnly", async () => ({ model: "iPhone 17", cost: null }));
  model.mock.mockImplementationOnce(async () => { throw new Error("temporary failure"); });
  await warehouseService.saveWarehouse([
    { name: "iPhone 17 256 Black Esim", price: "240" },
    { name: "Apple iPhone 17 256 Black Esim", price: "250" },
  ]);
  const result = warehouseService.getWarehouseIngestResult();
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].price, "240");
  assert.deepEqual(result.skipped, []);
});

test("MacBook flag stays local: AI receives only product name and card gets Russia flag", async () => {
  products.getProductCache().clear();
  warehouseAppleRecognition();
  const extract = mock.method(ai, "callAIForProduct", async () => ({ result: {
    status: "ok", confidence: 0.95, model: "MacBook Air 13 M5", color: "Starlight",
  }, cost: null }));
  await warehouseService.saveWarehouse([
    { name: "MacBook Air 13 M5 24/512 Starlight 🇷🇺", price: "900" },
    { name: "MacBook Air 13 M5 24/512 Starlight 🇷🇺", price: "890" },
  ]);
  assert.equal(extract.mock.callCount(), 1);
  assert.equal(extract.mock.calls[0].arguments[0], "MacBook Air 13 M5 24/512 Starlight");
  assert.equal(products.getProductCache().size, 1);
  const created = products.getProductCacheValues()[0];
  assert.equal(created.attributes?.country, "🇷🇺");
  assert.equal(created.name, "MacBook Air 13 M5 24/512 Starlight");
  assert.equal(catalog.getCatalogItem(created.id)?.offers[0].price, "890");
  assert.deepEqual(created.rawNames, ["MacBook Air 13 M5 24/512 Starlight 🇷🇺"]);
  // Поиск и восстановление из файла используют каноническое название с флагом.
  assert.equal(imports.ingestWarehousePrices([
    { name: "MacBook Air 13 M5 24/512 Starlight 🇷🇺", price: "880" },
  ]).items[0].product.id, created.id);
  await warehouseService.saveWarehouse([
    { name: "MacBook Air 13 M5 24/512 Starlight 🇷🇺", price: "880" },
  ]);
  assert.equal(extract.mock.callCount(), 1);
  assert.deepEqual(products.getProductCacheValues()[0].rawNames, created.rawNames);
});

test("AI never receives flags, SIM or activation when recognizing a new warehouse iPhone", async () => {
  products.getProductCache().clear();
  warehouseAppleRecognition();
  const extract = mock.method(ai, "extractModelOnly", async () => ({ model: "iPhone 17 Pro", cost: null }));
  await warehouseService.saveWarehouse([{ name: "Apple iPhone 17 Pro 256 Black (ESIM) 🇯🇵 (Active)", price: "500" }]);
  assert.equal(extract.mock.calls[0].arguments[0], "Apple iPhone 17 Pro 256 Black");
  const created = products.getProductCacheValues()[0];
  assert.equal(created.attributes?.sim, "ESIM");
  assert.equal(created.attributes?.activated, true);
  assert.equal(created.attributes?.country, undefined);
});

test("Russia and EU flag MacBooks stay distinct while AI sees the same product text", async () => {
  products.getProductCache().clear();
  warehouseAppleRecognition();
  const extract = mock.method(ai, "callAIForProduct", async () => ({ result: {
    status: "ok", confidence: 0.95, model: "MacBook Air 13 M5", color: "Starlight",
  }, cost: null }));
  await warehouseService.saveWarehouse([{ name: "MacBook Air 13 M5 24/512 Starlight 🇷🇺", price: "900" },
    { name: "MacBook Air 13 M5 24/512 Starlight 🇪🇺", price: "950" }]);
  assert.equal(products.getProductCache().size, 2);
  assert.ok(extract.mock.calls.every(call => call.arguments[0] === "MacBook Air 13 M5 24/512 Starlight"));
  assert.deepEqual(new Set(products.getProductCacheValues().map(p => p.attributes?.country)), new Set(["🇷🇺", "🇪🇺"]));
});

test("warehouse lookup does not convert RU or other letter codes into regional flags", () => {
  products.getProductCache().clear();
  const name = "MacBook Air 13 M5 24/512 Starlight";
  for (const country of ["🇷🇺", "🇪🇺", "🇺🇸"]) {
    products.setProductToCache(country, { ...product, id: country, name, brand: "Apple", category: "Ноутбуки",
      rawNames: [`${name} ${country}`], attributes: { country } });
  }
  const result = imports.ingestWarehousePrices(["RU", "EU", "US"].map(code => ({ name: `${name} ${code}`, price: "900" })));
  assert.equal(result.items.length, 0);
  assert.equal(result.skipped[0].names.length, 3);
  assert.equal(imports.ingestWarehousePrices([{ name: `${name} 🇷🇺`, price: "900" }]).items[0].product.id, "🇷🇺");
});
