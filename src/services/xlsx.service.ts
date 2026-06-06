import * as XLSX from "xlsx";
import { IngestItem, SimType } from "../types";
import { callAIForProductMatch, extractProductAttributes } from "../ai/productAI";
import {
	cleanProductName,
	extractActivated,
	extractFlags,
	normalizeSimByRules,
	normalizeStorageForCatalog,
	extractSim,
	hasConnectivity,
	hasChip,
	extractDisplayFinish,
	normalizeModelForIPadMini,
} from "../utils";
import { extractBrandFromStart, resolveBrandFromName } from "./brands.service";
import {
	addRawNameIfNeeded,
	buildAAAStoreRawName,
	buildTodayThereTomorrowHereRawName,
	normalize,
	upsertProduct,
} from "./products/product.builder";
import {
	findByRawName,
	getProductCache,
	matchProduct,
	saveProductCache,
	getProductFromCacheById,
} from "./products/products.service";
import { SAVE_EVERY_NUMBER_ITEMS, TODAY_THERE_TOMORROW_HERE_PRICE_DELIVERY } from "../constants";
import { resolveColorFromName, normalizeColorInProductName } from "./colors.service";

function hasRequiredColumns(row: Record<string, unknown>): boolean {
	return ["SKU", "Категория", "Название", "Модель", "Цена"]
		.every(col => col in row);
}

function getCategory(name: string) {
	const normalizeString = name.toLowerCase()
	if (normalizeString.includes("iphone")) return "Смартфоны";
	if (normalizeString.includes("macbook")) return "Ноутбуки";
	if (normalizeString.includes("mac ")) return "Компьютер";
	if (normalizeString.includes("ipad")) return "Планшеты";
	if (normalizeString.includes("airpods")) return "Наушники";
	if (normalizeString.includes("watch")) return "Часы";
	if (normalizeString.includes("display")) return "Монитор";
	return "Аксессуары";
}

async function processItem(input: {
	rawNameForMatch: string;
	rawName: string;
	price: string;
	brand: string;
	category: string;
	model: string;
	storage?: string;
	color?: string;
	country?: string;
	sim?: SimType;
	activated?: boolean,
	connectivity?: "WiFi" | "LTE";
  chip?: string; 
	isAppleSmartphone?: boolean;
}): Promise<IngestItem | undefined> {
	const {
		rawNameForMatch,
		rawName,
		price,
		brand,
		category,
		model,
		storage,
		color,
		country,
		sim,
		activated,
		connectivity,
    chip, 
		isAppleSmartphone
	} = input;
	const match = matchProduct({
		rawName: rawNameForMatch,
		brand,
		category,
		model,
		storage,
		color,
		sim,
		activated,
		connectivity,
    chip, 
	});

	if (match?.product) {
		addRawNameIfNeeded(match.product, rawNameForMatch);
		return {
			product: match.product,
			price,
			rawNameForMatch,
			isNew: false,
		};
	}

	const product = upsertProduct({
		rawName: rawNameForMatch,
		brand,
		category,
		model,
		name: rawName,
		attributes: {
			storage: storage,
			color: color,
			country: isAppleSmartphone ? undefined : country,
			sim,
			activated,
			connectivity,
    	chip, 
		},
	});

	if (!product) return;

	return { product, price, rawNameForMatch, isNew: true, };
}

export async function ingestAAAStorePrice(
	buffer: Buffer,
	options?: {
		onUnknownBrand?: (names: string[]) => Promise<void> | void;
		onAiError?: (names: string[]) => Promise<void> | void;
		onUnresolvedItems?: (names: string[]) => Promise<void> | void;
		onCostReport?: (cost: number) => Promise<void> | void;
	}
): Promise<IngestItem[]> {
	const workbook = XLSX.read(buffer, { type: "buffer" });
	const sheet = workbook.Sheets[workbook.SheetNames[0]];

	const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
		defval: "",
	});

	if (!rows.length || !hasRequiredColumns(rows[0])) {
		throw new Error("Неверный формат XLSX файла");
	}

	const result: IngestItem[] = [];
	const unknownBrands = new Set<string>();
	const unresolvedItems = new Set<string>();
	const aiErrors = new Set<string>();

	const chunkSize = 15;
	let unsavedCount = 0;
	let totalAICost = 0;

	for (let i = 0; i < rows.length; i += chunkSize) {
		const chunk = rows.slice(i, i + chunkSize);

		const chunkResults = await Promise.all(
			chunk.map(async (row): Promise<IngestItem | undefined> => {
				const category = String(row["Категория"] ?? "").trim();
				const name = String(row["Название"] ?? "").trim();
				const model = String(row["Модель"] ?? "").trim();
				const storageRaw = String(row["Хранилище"] ?? "").trim();
				const price = String(row["Цена"] ?? "").trim();
				const country = String(row["Страна"] ?? "");
				const simTypeRaw = String(row["Тип SIM"] ?? "");

				if (!name || !price) return;

				const brand = resolveBrandFromName(name);
				if (!brand) {
					unknownBrands.add(name);
					return;
				}
				
				let finalModel = model;
				if (brand === "Apple" && category === "Планшеты") {
					finalModel = normalizeModelForIPadMini(finalModel, name);
				}
				const color = resolveColorFromName(name);
				const isAppleSmartphone =
					brand === "Apple" && category === "Смартфоны";
				const sim = normalizeSimByRules({
					name,
					category,
					country,
					simTypeRaw,
				});
				const displayFinish = extractDisplayFinish(name);

				const rawNameForMatch = buildAAAStoreRawName({
					name,
					country: isAppleSmartphone ? undefined : country,
					sim,
				});

				// 1. Прямой поиск по rawName
				let match = findByRawName(rawNameForMatch);
				if (match) {
					return {
						product: match,
						price,
						rawNameForMatch,
						isNew: false,
					};
				}

				if (!isAppleSmartphone) {
					const finalStorage = storageRaw || normalizeStorageForCatalog(name);
					// Страну для не-смартфонов не убираем
					const finalCountry = country;
					const newProduct = upsertProduct({
						rawName: name,
						brand,
						category,
						model: finalModel || "",
						name: name,
						attributes: {
							storage: finalStorage,
							color,
							country: finalCountry,
							sim,
						},
					});
					return { product: newProduct, price, rawNameForMatch, isNew: true };
				}

				// 2. Извлечение атрибутов через AI (один запрос)
        const extracted = await extractProductAttributes(name, category);
        if (!extracted.attrs) {
          unresolvedItems.add(name);
          return;
        }

				let { model: extractedModel, connectivity, chip } = extracted.attrs;
        const { cost } = extracted;
        if (cost !== null) totalAICost += cost;

				// 3. Фильтрация кандидатов
        const cachedProducts = getProductCache();
        const candidates = [...cachedProducts.values()].filter(p => {
          if (p.brand !== brand) return false;
          if (p.category !== category) return false;
          const storage = storageRaw.length ? storageRaw : normalizeStorageForCatalog(name);
          if (storage && normalizeStorageForCatalog(p.attributes?.storage || "") !== storage) return false;
          if (sim && p.attributes?.sim !== sim) return false;
          if (connectivity) {
            const match = p.rawNames.some(raw => hasConnectivity(raw, connectivity)) ||
                          hasConnectivity(p.name, connectivity);
            if (!match) return false;
          }
          if (chip) {
            const match = p.rawNames.some(raw => hasChip(raw, chip)) ||
                          hasChip(p.name, chip);
            if (!match) return false;
          }
          // if (displayFinish && p.attributes?.displayFinish !== displayFinish) return false;
          return true;
        }).map(p => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          category: p.category,
          model: p.model,
          storage: p.attributes?.storage ?? "",
          color: p.attributes?.color,
          // connectivity: p.attributes?.connectivity,
          // chip: p.attributes?.chip,
          // displayFinish: p.attributes?.displayFinish,
        }));

				let matchedProduct = null;

				// 4. Детерминированный поиск по model (извлечённой AI)
				if (extractedModel) {
          const foundCandidate = candidates.find(p =>
            p.model.toLowerCase() === extractedModel.toLowerCase() &&
            (!storageRaw || normalizeStorageForCatalog(p.storage) === normalizeStorageForCatalog(storageRaw)) &&
            // (!connectivity || p.connectivity === connectivity) &&
            // (!chip || p.chip === chip) &&
            (!color || p.color === color)
          );
          if (foundCandidate) {
            const candidateProduct = await getProductFromCacheById(foundCandidate.id);
            if (candidateProduct) {
              const incomingColor = color;
              const candidateColor = candidateProduct.attributes?.color;
              if (incomingColor && candidateColor && incomingColor.toLowerCase() !== candidateColor.toLowerCase()) {
                aiErrors.add(name);
              } else {
                matchedProduct = candidateProduct;
              }
            }
          }
        }

				// 5. AI‑матчинг (если не нашли и есть кандидаты)
				// if (!matchedProduct && candidates.length > 0) {
				// 	const { result: ai, cost: matchCost } = await callAIForProductMatch(name, candidates, category);
        //   if (matchCost !== null) totalAICost += matchCost;
        //   if (!ai || ai.status === "error") {
        //     aiErrors.add(name);
        //     return;
        //   }
        //   if (ai.status === "matched" && ai.productId) {
        //     matchedProduct = await getProductFromCacheById(ai.productId);
        //   }
				// }

				// 6. Если нашли – добавляем синоним и возвращаем
				if (matchedProduct) {
          addRawNameIfNeeded(matchedProduct, name);
          return { product: matchedProduct, price, rawNameForMatch, isNew: false };
        }

				// 7. Не нашли – создаём новый товар
				const finalStorage = storageRaw.length ? storageRaw : normalizeStorageForCatalog(name);
				const finalCountry = isAppleSmartphone ? undefined : country;
        const newProduct = upsertProduct({
          rawName: name,
          brand,
          category,
          model: finalModel || extractedModel || "",
          name: name,
          attributes: {
            storage: finalStorage,
            color,
            country: finalCountry,
            sim,
            connectivity: connectivity || undefined,
            chip: chip || undefined,
            displayFinish: displayFinish || undefined,
          },
        });
        return { product: newProduct, price, rawNameForMatch, isNew: true };
			})
		);

		const grouped = new Map<string, IngestItem>();

		for (const item of chunkResults) {

			if (!item) continue;
			// 👇 ключ — товар в рамках ПРАЙСА, а не кеша
			const key = item.rawNameForMatch + "|" + item.product.id;
			const existing = grouped.get(key);
			if (!existing) {
				grouped.set(key, item);
				continue;
			}
			if (Number(item.price) < Number(existing.price)) {
				grouped.set(key, item);
			}
		}

		const valid = [...grouped.values()];

		result.push(...valid);

		unsavedCount += valid.length;

		if (unsavedCount >= SAVE_EVERY_NUMBER_ITEMS) {
			saveProductCache();
			unsavedCount = 0;
		}
	}

	if (unknownBrands.size && options?.onUnknownBrand) {
		await options.onUnknownBrand([...unknownBrands]);
	}

	if (aiErrors.size && options?.onAiError) {
		await options.onAiError([...aiErrors]);
	}

	if (unresolvedItems.size && options?.onUnresolvedItems) {
		await options.onUnresolvedItems([...unresolvedItems]);
	}

	if (totalAICost > 0 && options?.onCostReport) {
    await options.onCostReport(totalAICost);
  }

	saveProductCache();

	return result;
}

export async function ingestTodayThereTomorrowHerePrice(
	buffer: Buffer,
	options?: {
		onUnknownBrand?: (names: string[]) => Promise<void> | void;
		onAiError?: (names: string[]) => Promise<void> | void;
		onUnresolvedItems?: (names: string[]) => Promise<void> | void;
		onCostReport?: (cost: number) => Promise<void> | void;
	}
): Promise<IngestItem[]> {
	const workbook = XLSX.read(buffer, { type: "buffer" });
	const sheet = workbook.Sheets[workbook.SheetNames[0]];

	const range = XLSX.utils.decode_range(sheet["!ref"]!);
	const rows: { name: string; price: string }[] = [];

	for (let r = 0; r <= range.e.r; r++) {
		const name =
			sheet[XLSX.utils.encode_cell({ r, c: 0 })]?.v?.toString().trim() ?? "";
		const priceRaw =
			sheet[XLSX.utils.encode_cell({ r, c: 1 })]?.v?.toString().trim() ?? "";

		if (!name || !priceRaw) continue;

		const category = getCategory(name);
		if (category !== "Смартфоны") continue;

		const price = String(Number(priceRaw) + TODAY_THERE_TOMORROW_HERE_PRICE_DELIVERY);

		rows.push({ name, price });
	}

	const result: IngestItem[] = [];
	const unknownBrands = new Set<string>();
	const unresolvedItems = new Set<string>();
	const aiErrors = new Set<string>();

	const chunkSize = 15;
	let unsavedCount = 0;
	let totalAICost = 0;

	for (let i = 0; i < rows.length; i += chunkSize) {
		const chunk = rows.slice(i, i + chunkSize);

		const chunkResults = await Promise.all(
			chunk.map(async ({ name, price }): Promise<IngestItem | undefined> => {
				const { brand, nameWithoutBrand } = extractBrandFromStart(name);

				if (!brand || !nameWithoutBrand) {
					unknownBrands.add(name);
					return;
				}

				const category = getCategory(name);
				const country = extractFlags(name);
				const color = resolveColorFromName(name);
				const storage = normalizeStorageForCatalog(name);
				let nameForCatalog = cleanProductName(nameWithoutBrand);
				nameForCatalog = normalizeColorInProductName(nameForCatalog);

				const isAppleSmartphone =
					brand === "Apple" && category === "Смартфоны";

				const activated = extractActivated(name);
				const sim = extractSim(name) ?? normalizeSimByRules({ name, category, country });
				const displayFinish = extractDisplayFinish(name);
				const rawNameForMatch = buildTodayThereTomorrowHereRawName({
					name,
					sim,
					activated,
				});
				
				// 1. Поиск по rawName
				let existingByRaw = null;

				if (activated === true) {
					// Ищем только среди активных продуктов
					const cache = getProductCache();
					existingByRaw = [...cache.values()].find(p =>
						p.attributes?.activated === true &&
						p.rawNames.some(raw => normalize(raw) === normalize(rawNameForMatch))
					);
				} else {
					existingByRaw = findByRawName(rawNameForMatch);
				}

				if (existingByRaw) {
					addRawNameIfNeeded(existingByRaw, rawNameForMatch);
					return {
						product: existingByRaw,
						price,
						rawNameForMatch,
						isNew: false,
					};
				}

				// 2. Извлечение атрибутов через AI (один запрос)
				const extracted = await extractProductAttributes(name, category);
				if (!extracted.attrs) {
					unresolvedItems.add(name);
					return;
				}
				const { attrs: {model, connectivity: extractedConnectivity, chip}, cost } = extracted;
				if (cost !== null) totalAICost += cost;
				const connectivity = category === "Планшеты" ? extractedConnectivity : undefined;

				// 3. Фильтрация кандидатов с учётом извлечённых полей
				const cachedProducts = getProductCache();
				const candidates = [...cachedProducts.values()].filter(p => {
  				if (p.brand !== brand) return false;
					if (p.category !== category) return false;
					if (storage && normalizeStorageForCatalog(p.attributes?.storage || "") !== storage) return false;
  				if (sim && p.attributes?.sim !== sim) return false;
					if (connectivity) {
						const match = p.rawNames.some(raw => hasConnectivity(raw, connectivity)) ||
													hasConnectivity(p.name, connectivity);
						if (!match) return false;
					}
					if (chip) {
						const match = p.rawNames.some(raw => hasChip(raw, chip)) ||
													hasChip(p.name, chip);
						if (!match) return false;
					}
					// if (displayFinish && p.attributes?.displayFinish !== displayFinish) return false;
					return true;
				}).map(p => ({
					id: p.id,
					name: p.name,
					brand: p.brand,
					category: p.category,
					model: p.model,
					storage: p.attributes?.storage ?? "",
					color: p.attributes?.color,
					// connectivity: p.attributes?.connectivity,
          // chip: p.attributes?.chip,
					// displayFinish: p.attributes?.displayFinish,
				}));

				let matchedProduct = null;

				// 4. Детерминированный поиск по model (если есть)
				if (model) {
					const foundCandidate = candidates.find(p =>
    				p.model.toLowerCase() === model.toLowerCase() &&
						(!storage || normalizeStorageForCatalog(p.storage) === storage) &&
						// (!connectivity || p.connectivity === connectivity) &&
						// (!chip || p.chip === chip) &&
						(!color || p.color === color)
					);
					if (foundCandidate) {
						const candidateProduct = await getProductFromCacheById(foundCandidate.id);
						if (candidateProduct) {
							// Пост-проверка цвета
							const incomingColor = resolveColorFromName(name);
							const candidateColor = candidateProduct.attributes?.color;
							if (incomingColor && candidateColor && incomingColor.toLowerCase() !== candidateColor.toLowerCase()) {
								// Несоответствие цвета — отклоняем матч
								aiErrors.add(name);
							} else {
								matchedProduct = candidateProduct;
							}
						}
					}
				}

				// 5. Если не нашли – AI-матчинг (только если есть кандидаты)
				if (!matchedProduct && candidates.length > 0) {
					const { result: ai, cost: matchCost } = await callAIForProductMatch(name, candidates, category);
					if (matchCost !== null) totalAICost += matchCost;
					if (!ai || ai.status === "error") {
						aiErrors.add(name);
						return;
					}
					if (ai.status === "matched" && ai.productId) {
						matchedProduct = await getProductFromCacheById(ai.productId);
					}
				}

				// 6. Если всё ещё не нашли – создаём новый продукт (без второго AI-запроса)
				if (!matchedProduct) {
  				const finalCountry = isAppleSmartphone ? undefined : country;
					const newProduct = upsertProduct({
            rawName: rawNameForMatch,
            brand,
            category,
            model: model,
            name: nameForCatalog,
            attributes: {
              storage: storage,
              color,
              country: finalCountry,
              sim,
              activated,
              connectivity: connectivity || undefined,
              chip: chip || undefined,
							displayFinish: displayFinish || undefined,
            },
          });
					
					return { product: newProduct, price, rawNameForMatch, isNew: true };
				}
				
				// 7. Нашли существующий продукт
				addRawNameIfNeeded(matchedProduct, rawNameForMatch);
        return {
          product: matchedProduct,
          price,
          rawNameForMatch,
          isNew: false,
        };
			})
		);

		const grouped = new Map<string, IngestItem>();

		for (const item of chunkResults) {

			if (!item) continue;
			// 👇 ключ — товар в рамках ПРАЙСА, а не кеша
			const key = item.rawNameForMatch + "|" + item.product.id;
			const existing = grouped.get(key);
			if (!existing) {
				grouped.set(key, item);
				continue;
			}
			if (Number(item.price) < Number(existing.price)) {
				grouped.set(key, item);
			}
		}

		const valid = [...grouped.values()];

		result.push(...valid);

		unsavedCount += valid.length;

		if (unsavedCount >= SAVE_EVERY_NUMBER_ITEMS) {
			saveProductCache();
			unsavedCount = 0;
		}
	}

	if (unknownBrands.size && options?.onUnknownBrand) {
		await options.onUnknownBrand([...unknownBrands]);
	}

	if (aiErrors.size && options?.onAiError) {
		await options.onAiError([...aiErrors]);
	}

	if (unresolvedItems.size && options?.onUnresolvedItems) {
		await options.onUnresolvedItems([...unresolvedItems]);
	}

	if (totalAICost > 0 && options?.onCostReport) {
    await options.onCostReport(totalAICost);
  }

	saveProductCache();

	return result;
}
