export const CATEGORY_MAP = {
  smartphone: "Смартфоны",
  laptop: "Ноутбуки",
  tablet: "Планшеты",
  smartwatch: "Часы",
  headphones: "Наушники",
  accessory: "Аксессуары",
  media_disc: "Диски",

  speaker: "Колонки",
  charger: "Зарядные устройства",
  purifier: "Очистители/увлажнители",
  vacuum: "Пылесосы",

  styler: "Стайлер",
  straightener: "Выпрямитель",
  hair_dryer: "Фен",

  console: "Игровые приставки",
  gamepad: "Джойстики",

  camera: "Камеры",
  soundbar: "Саундбары",
  monitor: "Монитор",
  computer: "Компьютер",

  unknown: "Другое",
} as const;

// Категории, для которых регион в id/rawName был включён первой миграцией
// (см. scripts/purge-region-unaware-appliances.ts). Сейчас логика в xlsx.service.ts
// учитывает регион для любой категории (кроме iPhone), где он указан в прайсе —
// этот список больше не участвует в основной логике, оставлен только для скрипта-чистильщика.
export const REGION_SENSITIVE_CATEGORIES: ReadonlySet<string> = new Set([
  CATEGORY_MAP.vacuum,
  CATEGORY_MAP.hair_dryer,
  CATEGORY_MAP.styler,
  CATEGORY_MAP.straightener,
  CATEGORY_MAP.purifier,
]);

export const CATEGORY_REVERSE_MAP: Record<string, keyof typeof CATEGORY_MAP> = {
  "Смартфоны": "smartphone",
  "Ноутбуки": "laptop",
  "Планшеты": "tablet",
  "Часы": "smartwatch",
  "Наушники": "headphones",
  "Аксессуары": "accessory",
  "Диски": "media_disc",

  "Колонки": "speaker",
  "Зарядные устройства": "charger",
  "Очистители/увлажнители": "purifier",
  "Пылесосы": "vacuum",

  "Стайлер": "styler",
  "Выпрямитель": "straightener",
  "Фен": "hair_dryer",

  "Игровые приставки": "console",
  "Джойстики": "gamepad",

  "Камеры": "camera",
  "Саундбары": "soundbar",
  "Монитор": "monitor",
  "Компьютер": "computer",
};