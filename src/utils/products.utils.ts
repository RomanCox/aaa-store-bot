import {
	NEW_ESIM_ONLY_COUNTRIES, NEW_SIM_ONLY_COUNTRIES,
	OLD_ESIM_ONLY_COUNTRIES, OLD_SIM_ONLY_COUNTRIES,
	Product,
	ProductForUI,
	SimType
} from "../types";
import { compareSpecs, extractMemorySubstring, extractModelKey } from "./catalog.utils";
import { brandsFromConfig } from "../services/brands.service";

const CATEGORY_ORDER = [
	"Смартфоны",
	"Ноутбуки",
  "Компьютер",
	"Планшеты",
	"Наушники",
	"Часы",
  "Джойстики",
	"Аксессуары",
] as const;

function sortByPriority(
	items: string[],
	priorityOrder: readonly string[],
	locale: string = "ru"
): string[] {

	const priorityMap = new Map<string, number>(
		priorityOrder.map((value, index) => [value, index])
	);

	return [...items].sort((a, b) => {
		const indexA = priorityMap.get(a);
		const indexB = priorityMap.get(b);

		if (indexA !== undefined && indexB !== undefined) {
			return indexA - indexB;
		}

		if (indexA !== undefined) return -1;
		if (indexB !== undefined) return 1;

		return a.localeCompare(b, locale, {
			sensitivity: "base",
			numeric: true,
		});
	});
}

function normalizeForCompare(value?: string): string {
	return (value ?? "")
		.trim()
		.replace(/\s+/g, "")
		.replace(/-+/g, "-")
		.toUpperCase();
}

function compare(a?: string, b?: string): number {
	return normalizeForCompare(a)
		.localeCompare(normalizeForCompare(b), "ru", {
			numeric: true,
			sensitivity: "base",
		});
}

function normalizeSimString(input: string): SimType {
	const s = input.toLowerCase().replace(/\s+/g, "");
	if (
		s.includes("esim+") ||
		s.includes("+esim") ||
		s.includes("sim+esim") ||
		s.includes("esim+sim")
	) {
		return "SIM + ESIM";
	}
	if (s.includes("esim")) {
		return "ESIM";
	}
	if (s.includes("2sim") || s.includes("dual")) {
		return "Dual SIM";
	}
	if (s.includes("1sim") || s.includes("sim")) {
		return "SIM";
	}
	return undefined;
}

export function normalizeSimByRules(input: {
	name: string;
	category: string;
	country: string;
	simTypeRaw?: string;
}): SimType {
	const name = input.name.toLowerCase();
	const country = input.country;

	// 👉 НЕ смартфоны
	if (input.category !== "Смартфоны") {
		return undefined;
	}

	// 🔥 1. приоритет — колонка (1-й прайс)
	if (input.simTypeRaw) {
		return normalizeSimString(input.simTypeRaw);
	}

	// 🔥 2. потом строка (2-й прайс)
	const extracted = extractSim(input.name);
	if (extracted) {
		return extracted;
	}

	// 🔥 3. fallback правила

	if (name.includes("air")) {
		return "ESIM";
	}

	const isIn = (set: Set<string>) => country && set.has(country);

	if (name.includes("iphone 17")) {
		if (isIn(NEW_SIM_ONLY_COUNTRIES)) {
			return "Dual SIM";
		}
		if (isIn(NEW_ESIM_ONLY_COUNTRIES)) {
			return "ESIM";
		}
		return "SIM + ESIM";
	}

	if (
		name.includes("iphone 14") ||
		name.includes("iphone 15") ||
		name.includes("iphone 16")
	) {
		if (isIn(OLD_SIM_ONLY_COUNTRIES)) {
			return "Dual SIM";
		}
		if (isIn(OLD_ESIM_ONLY_COUNTRIES)) {
			return "ESIM";
		}
		return "SIM + ESIM";
	}

	if (name.includes("iphone")) {
		if (isIn(OLD_SIM_ONLY_COUNTRIES)) {
			return "Dual SIM";
		}
		return "SIM + ESIM";
	}

	return undefined;
}

export function sortProducts(products: ProductForUI[]): ProductForUI[] {
  return [...products].sort((a, b) =>
    compare(a.brand, b.brand) ||
    compare(a.category, b.category) ||
    compare(a.model, b.model) ||
    compare(extractModelKey(a.name ?? ""), extractModelKey(b.name ?? "")) ||
    compareSpecs(
      extractMemorySubstring(a.name),
      extractMemorySubstring(b.name)
    ) ||
    compare(a.name, b.name)
  );
}

export function getBrands(products: Product[]): string[] {
  const brandsFromState = brandsFromConfig();
  const brands = Array.from(
		new Set(
			products
				.map(p => p.brand)
				.filter((brand): brand is string => Boolean(brand))
				.filter(brand => brandsFromState.includes(brand))
		)
	);``

  return brands.sort((a, b) => {
    const indexA = brandsFromState.indexOf(a);
    const indexB = brandsFromState.indexOf(b);
    return indexA - indexB;
  });
}

export function getCategories(
	products: Product[],
	brand?: string
): string[] {
	const categories = Array.from(
		new Set(
			products
				.filter(p => p.brand === brand)
				.map(p => p.category)
				.filter(Boolean)
		)
	);

	return sortByPriority(categories, CATEGORY_ORDER);
}

export function getModels(
	products: Product[],
	brand?: string,
	category?: string,
): string[] {
	return Array.from(
		new Set(
			products
				.filter(p => (p.brand === brand && p.category === category))
				.map(p => p.model)
				.filter(Boolean)
		)
	);
}

export function getStorageValues(
	products: Product[],
	brand?: string,
	category?: string,
	model?: string,
): string[] {
	return Array.from(
		new Set(
			products
				.filter(p => (p.brand === brand && p.category === category && p.model === model))
				.map(p => p.storage)
				.filter((storage): storage is string => typeof storage === "string"),
		)
	);
}

export function extractFlags(name: string): string {
	const match = name.match(/[\u{1F1E6}-\u{1F1FF}]{2}/u);
	return match?.[0] ?? "";
}

export function extractSim(name: string): SimType {
	const match = name.match(/\(([^)]*sim[^)]*)\)/i);
	if (!match) return undefined;

	const raw = match[1]
		.toLowerCase()
		.replace(/\s+/g, "")
		.replace(/-/g, "");

	// Разбиваем на компоненты (разделитель +)
  const parts = raw.split('+').map(p => p.trim());

	const hasSim = parts.includes('sim') || parts.includes('1sim');
  const hasEsim = parts.includes('esim');
  const hasDual = parts.includes('2sim') || parts.includes('dual');

	if (hasEsim && hasSim) return "SIM + ESIM";
  if (hasEsim) return "ESIM";
  if (hasDual) return "Dual SIM";
  if (hasSim) return "SIM";

	return undefined;
}

export function extractActivated(name: string): boolean {
	return /\(active\)/i.test(name);
}

export function cleanProductName(name: string): string {
  return name
    .replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, "")   // флаги
    .replace(/\(active\)/gi, "")                 // (active)
    .replace(/\bactive\b/gi, "")                // active без скобок
    .replace(/🔓/g, "")                          // эмодзи unlocked
		// --- удалить указания на SIM (со скобками и без) ---
		.replace(/\([^)]*(?:sim|esim|eSim|dual|1sim|2sim|1Sim|2Sim)[^)]*\)/gi, '')
    .replace(/\b(?:sim|esim|eSim|dual|1sim|2sim|1Sim|2Sim)\b/gi, '')
    .replace(/\s+/g, " ")
    .trim();
}

export function buildRawName(input: {
	name: string;
	brand?: string;
	country?: string[];
	sim?: string;
	activated?: boolean;
}) {
	let result = input.name;

	// добавляем бренд если его нет
	if (input.brand && !result.toLowerCase().includes(input.brand.toLowerCase())) {
		result = `${input.brand} ${result}`;
	}

	// добавляем sim
	if (input.sim) {
		result += ` (${input.sim})`;
	}

	// activated
	if (input.activated) {
		result += ` (Active)`;
	}

	// страны
	if (input.country?.length) {
		result += ` ${input.country.join(" ")}`;
	}

	return result;
}

export function replaceStorageInName(name: string): string {
  const regex = /(\/?)(1024|2048|3072|4096)(\s*)(GB|gb|Gb)?/g;
  return name.replace(regex, (_, slash, size, spaces) => {
    const tbValue = parseInt(size, 10) / 1024;
    const spaceBeforeTB = slash === '/' ? ' ' : '';
    return `${slash}${tbValue}${spaceBeforeTB}TB${spaces}`;
  });
}

const VALID_STORAGES = new Set([64, 128, 256, 512, 1024, 2048, 3072, 4096]);

export function normalizeStorageForCatalog(value: string): string {
  const raw = value.trim();

  // 1. Дробь (RAM/Storage) – берём последнее число
  const slashPattern = /(\d+(?:\s*\/\s*\d+)+)(?:\s*(?:GB|Gb|TB|Tb))?/i;
  const slashMatch = raw.match(slashPattern);
  if (slashMatch) {
    const parts = slashMatch[1].split('/').map(p => p.trim());
    const lastPart = parts[parts.length - 1];
    const num = parseInt(lastPart, 10);
    if (!isNaN(num) && VALID_STORAGES.has(num)) return `${num} GB`;
  }

  // 2. Ищем все числа из допустимого набора, исключая те, которые являются частью модели (например, 17 в "iPhone 17")
  // Ищем числа, которые окружены границами слова \b и не находятся перед словом "iPhone" без пробела?
  // Простой способ: собрать все подходящие числа и выбрать максимальное (или последнее?).
  const possibleNumbers: number[] = [];
  for (const storage of VALID_STORAGES) {
    const regex = new RegExp(`\\b${storage}\\b`, 'g');
    let match;
    while ((match = regex.exec(raw)) !== null) {
      possibleNumbers.push(storage);
    }
  }
  if (possibleNumbers.length) {
    // Если несколько, взять максимальное (скорее всего, это объём памяти, а не модель)
    const maxStorage = Math.max(...possibleNumbers);
    return `${maxStorage} GB`;
  }

  // 3. Если число с GB/TB указано явно (например, 256GB)
  const withUnitMatch = raw.match(/\b(\d{2,4})\s*(GB|Gb|TB|Tb)\b/i);
  if (withUnitMatch) {
    let num = parseInt(withUnitMatch[1], 10);
    const unit = withUnitMatch[2].toUpperCase();
    if (unit.startsWith('TB')) num *= 1024;
    if (VALID_STORAGES.has(num)) return `${num} GB`;
  }

  return '';
}

export function extractConnectivity(name: string): "WiFi" | "LTE" | undefined {
  const lower = ` ${name.toLowerCase()} `;
  if (/\b(wifi|wi-fi|wireless)\b/.test(lower)) return "WiFi";
  if (/\b(lte|cellular|5g)\b/.test(lower)) return "LTE";
  return undefined;
}

export function hasConnectivity(name: string, target: "WiFi" | "LTE"): boolean {
  const lower = name.toLowerCase();
  const pattern = target === "WiFi" ? /\b(wifi|wi-fi|wireless)\b/ : /\b(lte|cellular|5g)\b/;
  return pattern.test(lower);
}

export function extractChip(name: string, category: string): string | undefined {
  if (category === "Ноутбуки" || category === "Компьютеры") {
    const match = name.match(/\b(M\d+(?:\s*(?:Pro|Max))?)\b/i);
    if (match) return match[1].toUpperCase().replace(/\s/g, '');
  } else {
    // Для смартфонов и планшетов – ищем A-чипы, не путаем с "Pro Max"
    const match = name.match(/\b(A\d{2,3}[X]?)\b/i);
    if (match) return match[1].toUpperCase();
  }
  return undefined;
}

export function hasChip(name: string, chip: string): boolean {
  const lower = name.toLowerCase();
  const chipLower = chip.toLowerCase();
  // Ищем как отдельное слово, с границами
  const pattern = new RegExp(`\\b${chipLower}\\b`, 'i');
  return pattern.test(lower);
}

export function extractDisplayFinish(name: string): "Nano Texture" | "" {
  return /\bNano\s*Texture\b/i.test(name) ? "Nano Texture" : "";
}

export function normalizeModelForIPadMini(
  originalModel: string,
  fullName: string,
): string {
  // Если модель уже содержит "iPad mini" в правильном формате, возвращаем её
  if (originalModel.match(/iPad mini \d/)) return originalModel;
  
  // Проверяем, что это планшет Apple и в названии есть mini
  const lowerFull = fullName.toLowerCase();
  if (lowerFull.includes("ipad mini")) {
    // Ищем цифру после mini
    const match = fullName.match(/\bmini\s+(\d+)\b/i);
    if (match && /^[1-9]$/.test(match[1])) {
      return `iPad mini ${match[1]}`;
    }
    return "iPad mini";
  }
  return originalModel;
}