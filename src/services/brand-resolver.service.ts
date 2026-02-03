export type Brand =
	| "Samsung"
	| "Apple"
	| "Honor"
	| "Xiaomi"
	| "Poco"
	| "Sony"
	| "Beats"
	| "Marshall"
	| "Bose"
	| "HarmanKardon"
	| "Dyson"
	| "Crest"
	| "Sonos"
	| "CD";

const BRAND_PREFIXES: Record<Brand, string[]> = {
	Samsung: ["Samsung", "Galaxy"],
	Apple: [
		"iPhone",
		"MacBook",
		"AirPods",
		"S10",
		"S11",
		"SE",
		"Ultra",
		"Ultra2",
		"Apple",
		"Magic Mouse",
		"iPad",
		"Display",
	],
	Honor: ["HONOR"],
	Xiaomi: ["Xiaomi", "Redmi", "Note"],
	Poco: ["Poco"],
	Sony: ["Sony", "PS5", "PlayStation"],
	Beats: ["Beats"],
	Marshall: ["Marshall"],
	Bose: ["Bose"],
	HarmanKardon: ["Harman Kardon"],
	Dyson: [
		"Dyson",
		"Щелевая Насадка",
		"Round Brush",
		"Насадка Лазер",
		"Подставка для выпрямителя",
		"Насадка для животных",
		"Gen5",
		"AКБ Gen5",
		"AKБ V11",
		"V12",
		"V8",
		"Pencilvac",
	],
	Crest: ["Crest"],
	Sonos: ["Sonos"],
	CD: ["📀"],
};

export function resolveBrandFromName(name: string): Brand | undefined {
	const trimmedName = name.trim();

	for (const [brand, prefixes] of Object.entries(BRAND_PREFIXES)) {
		if (
			prefixes.some(prefix =>
				trimmedName.startsWith(prefix)
			)
		) {
			return brand as Brand;
		}
	}

	return undefined;
}