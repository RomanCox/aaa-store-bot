export type Brand =
	| "Samsung"
	| "Apple"
	| "Honor"
	| "Xiaomi"
	| "Sony"
	| "Beats"
	| "Marshall"
	| "Bose"
	| "Harman Kardon"
	| "Dyson"
	| "Crest"
	| "Sonos"
	| "Canon"
	| "Logitech"
	| "XBox"
	| "Яндекс";

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
		"Magic Keyboard",
		"Magic Trackpad",
		"iPad",
		"iMac",
		"Mac",
		"Mac",
		"Display",
	],
	Honor: ["HONOR"],
	Xiaomi: ["Xiaomi", "Redmi", "Note", "Poco"],
	Sony: ["Sony", "PS5", "PlayStation", "📀"],
	Beats: ["Beats"],
	Marshall: ["Marshall"],
	Bose: ["Bose"],
	"Harman Kardon": ["Harman Kardon"],
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
		"V16",
		"V8",
		"Pencilvac",
    "Paddle Brush",
    "v15",
	],
	Crest: ["Crest"],
	Sonos: ["Sonos"],
	Canon: ["Canon"],
  Logitech: ["Logitech"],
  XBox: ["Гаймпад XBox"],
  "Яндекс": ["Яндекс"]
};

export function resolveBrandFromName(name: string): Brand | undefined {
	const trimmedName = name.trim().toLowerCase();

	for (const [brand, prefixes] of Object.entries(BRAND_PREFIXES)) {
		if (
			prefixes.some(prefix =>
				trimmedName.startsWith(prefix.toLowerCase())
			)
		) {
			return brand as Brand;
		}
	}

	return undefined;
}