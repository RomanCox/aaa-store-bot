// Диагностический скрипт (read-only, ничего не меняет) — консольная обёртка над той же
// логикой, что и кнопка "🔍 Товары с дублями rawNames" в админ-панели бота
// (см. getProductsWithManyRawNames в services/products/products.service.ts).
//
// У каждого товара в кеше есть rawNames — список "сырых" названий из прайсов,
// которые были сматчены в эту карточку. В норме их 1-2 (например, одно и то же
// название с разных прайсов, или с/без SIM-суффикса). Если у товара rawNames
// заметно больше — это повод присмотреться: похоже, что под одним id по ошибке
// схлопнулось несколько разных физических товаров (слишком нестрогий матчинг).
//
// Запуск из корня проекта:
//   npx ts-node scripts/report-products-with-many-rawnames.ts
//   npx ts-node scripts/report-products-with-many-rawnames.ts --min=4   — свой порог (по умолчанию 2)

import { loadProductCache, getProductCacheValues, getProductsWithManyRawNames } from "../src/services/products/products.service";

const minArg = process.argv.find(arg => arg.startsWith("--min="));
const minRawNames = minArg ? Number(minArg.slice("--min=".length)) : 2;

function main() {
  loadProductCache();

  const total = getProductCacheValues().length;
  const suspicious = getProductsWithManyRawNames(minRawNames);

  console.log(`Всего товаров в кеше: ${total}`);
  console.log(`С rawNames > ${minRawNames}: ${suspicious.length}\n`);

  for (const p of suspicious) {
    console.log(`[${p.category}] ${p.brand} ${p.model} — ${p.name} (${p.id})`);
    console.log(`  rawNames (${p.rawNames.length}):`);
    for (const raw of p.rawNames) {
      console.log(`    • ${raw}`);
    }
    console.log("");
  }

  if (!suspicious.length) {
    console.log("Подозрительных товаров не найдено.");
  }
}

main();
