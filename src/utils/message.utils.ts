import { Product } from "../types";
import { compareSpecs, extractMemorySubstring } from "./catalog.utils";
import { TELEGRAM_MESSAGE_LIMIT } from "../constants";

function formatProductLine(product: Product): string {
	const name = product.name
	const price = product.price
	const country = product.country ?? ""

	return `${name} - ${price} ${country}`
}

function getProductGroupKey(product: Product): string | null {
	const brand = product.brand?.toLowerCase() ?? "";
	const category = product.category?.toLowerCase() ?? "";
	const model = product.model?.trim() ?? "";

	// === Samsung смартфоны → по первой букве модели ===
	if (brand === "samsung" && category === "смартфоны") {
		const firstLetter = model[0]?.toUpperCase();
		return firstLetter ?? null;
	}

	// === Apple смартфоны → по поколению iPhone ===
	if (brand === "apple" && category === "смартфоны") {
		const parts = model.split(/\s+/);

		// ожидаем ["iPhone", "16e", ...]
		if (parts.length >= 2) {
			const secondWord = parts[1];

			// 16e → 16
			const match = secondWord.match(/\d+/);
			if (match) {
				return match[0];
			}
		}
	}

	return null;
}

function shouldSplitMessage({
															product,
															currentBrand,
															currentCategory,
															prevGroupKey,
														}: {
	product: Product;
	currentBrand: string | null;
	currentCategory: string | null;
	prevGroupKey: string | null;
}): boolean {
	const brand = product.brand ?? "";
	const category = product.category ?? "";

	// 1️⃣ Новый бренд или категория
	if (currentBrand !== brand || currentCategory !== category) {
		return true;
	}

	// 2️⃣ Проверка группировки внутри бренда
	const currentGroupKey = getProductGroupKey(product);

	return !!(prevGroupKey &&
		currentGroupKey &&
		prevGroupKey !== currentGroupKey);
}

type ProductMessage = {
  text: string;
  products: Product[];
};

export function buildMessagesWithProducts(products: Product[]): ProductMessage[] {
  const messages: ProductMessage[] = [];

  let currentMessage = "";
  let currentProducts: Product[] = [];
  let currentBrand: string | null = null;
  let currentCategory: string | null = null;
  let prevModel: string | null = null;
  let prevStorage: string | null = null;
  let prevGroupKey: string | null = null;

  for (const product of products) {
    const brand = product.brand ?? "";
    const category = product.category ?? "";

    if (
      shouldSplitMessage({
        product,
        currentBrand,
        currentCategory,
        prevGroupKey,
      })
    ) {
      if (currentMessage) {
        messages.push({ text: currentMessage, products: currentProducts });
      }

      currentMessage = "";
      currentProducts = [];
      currentBrand = brand;
      currentCategory = category;
      prevModel = null;
      prevStorage = null;
      prevGroupKey = null;
    }

    const model = product.model ?? "";
    const storage = extractMemorySubstring(product.name ?? null);

    if (currentMessage) {
      const modelChanged = prevModel && model !== prevModel;
      const storageChanged = prevStorage && storage && compareSpecs(prevStorage, storage) !== 0;

      if (modelChanged || storageChanged) {
        currentMessage += "\n";
      }
    }

    const line = formatProductLine(product);

    if ((currentMessage + line + " \n").length > TELEGRAM_MESSAGE_LIMIT) {
      messages.push({ text: currentMessage, products: currentProducts });
      currentMessage = "";
      currentProducts = [];
      prevModel = null;
      prevStorage = null;
      prevGroupKey = null;
    }

    currentMessage += line + " \n";
    currentProducts.push(product);

    const currentGroupKey = getProductGroupKey(product);
    if (currentGroupKey) prevGroupKey = currentGroupKey;

    prevModel = model;
    prevStorage = storage;
  }

  if (currentMessage) {
    messages.push({ text: currentMessage, products: currentProducts });
  }

  return messages;
}
