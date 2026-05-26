import fs from 'fs';
import { generateId } from "./services/products/productId";
import { getProductCache, loadProductCache, saveProductCache } from "./services/products/products.service";
import { CachedProduct } from './types';
import { extractFlags, normalizeSimByRules } from './utils';

async function migrateIds() {
  await loadProductCache();
  const products = getProductCache(); // Map<string, CachedProduct>
  
  const newMap = new Map<string, CachedProduct>();
  let duplicates = 0;
  let changed = 0;

  for (const [oldId, product] of products.entries()) {
    // ----- 1. Для Apple смартфонов обновляем rawNames и атрибуты -----
    if (product.brand === "Apple" && product.category === "Смартфоны") {
      let modified = false;
      let extractedSim = product.attributes?.sim || "";

      if (product.attributes?.country) {
        delete product.attributes.country;
        modified = true;
      }

      const newRawNames: string[] = [];
      for (const raw of product.rawNames) {
        // Извлекаем страну из raw
        const flags = extractFlags(raw);
        const country = flags || "";
        // Вычисляем SIM по правилам (используем raw с флагами или без)
        const sim = normalizeSimByRules({
          name: raw,
          category: product.category,
          country: country,
          simTypeRaw: undefined,
        });
        if (sim && sim !== extractedSim) {
          extractedSim = sim;
          modified = true;
        }
        // Очищаем: удаляем флаги, удаляем старые SIM-пометки в скобках
        let cleaned = raw.replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, '').trim();
        cleaned = cleaned.replace(/\([^)]*(?:sim|esim|dual|eSim|1Sim|2Sim)[^)]*\)/gi, '').trim();
        // Добавляем правильный SIM-суффикс, если sim определён
        if (sim) {
          cleaned += ` (${sim})`;
        }
        newRawNames.push(cleaned);
        // Если очищенная строка отличается от исходной, помечаем modified
        if (cleaned !== raw) modified = true;
      }
      if (modified) {
        if (extractedSim && product.attributes) product.attributes.sim = extractedSim;
        product.rawNames = [...new Set(newRawNames)]; // убираем дубликаты после очистки
      }
    }

    // ----- 2. Генерация нового ID на основе актуальных атрибутов -----
    const newId = generateId({
      brand: product.brand,
      category: product.category,
      model: product.model,
      storage: product.attributes?.storage,
      color: product.attributes?.color,
      country: product.attributes?.country,
      sim: product.attributes?.sim,
      activated: product.attributes?.activated,
      connectivity: product.attributes?.connectivity,
      chip: product.attributes?.chip,
      displayFinish: product.attributes?.displayFinish,
    });

    if (newId === oldId) {
      newMap.set(newId, product);
      continue;
    }

    if (newMap.has(newId)) {
      const existing = newMap.get(newId)!;
      existing.rawNames = [...new Set([...existing.rawNames, ...product.rawNames])];
      console.log(`Объединён дубликат ${oldId} -> ${newId}`);
      duplicates++;
    } else {
      product.id = newId;
      newMap.set(newId, product);
      changed++;
    }
  }

  // ----- 3. Сохраняем результат как массив -----
  const newCacheArray = Array.from(newMap.values());
  const newFilePath = './cached-products-migrated.json';
  fs.writeFileSync(newFilePath, JSON.stringify(newCacheArray, null, 2));

  console.log(`✅ Мигрированный кэш сохранён в ${newFilePath}`);
  console.log(`📦 Формат: массив (${newCacheArray.length} записей)`);
  console.log(`🔄 Изменено ID: ${changed}, дубликатов объединено: ${duplicates}`);
  console.log(`⚠️ Старый файл cached-products.json не тронут.`);
  console.log(`👉 После проверки замените старый файл на новый и перезапустите бота.`);
  console.log(`👉 Не забудьте обновить функции loadProductCache / saveProductCache для работы с массивом.`);
}

migrateIds().catch(console.error);