import path from "path";

export const TIME_LIMIT_DELETING_OLD_FILES = 60 * 60 * 1000;

export const MAX_PRICE = 20000;
export const TELEGRAM_MESSAGE_LIMIT = 3900;
export const USERS_PER_PAGE = 5;
export const ORDERS_PER_PAGE = 5;
export const MAX_BUTTONS_FOR_AMOUNT_KEYBOARD = 10;
export const BUTTONS_IN_RAW_FOR_AMOUNT_KEYBOARD = 5;
export const BUTTONS_IN_RAW_FOR_CATEGORIES_KEYBOARD = 2;
export const BUTTONS_IN_RAW_FOR_BRANDS_KEYBOARD = 2;
export const BUTTONS_IN_RAW_FOR_CHOOSING_PRODUCT_KEYBOARD = 4;
export const BUTTONS_IN_RAW_FOR_MODELS_KEYBOARD = 2;
export const BUTTONS_IN_RAW_FOR_STORAGE_VALUES_KEYBOARD = 2;
export const BUTTONS_IN_RAW_FOR_EDIT_CART_KEYBOARD = 5;
export const UI_VERSION = 1;

const envDataPath = process.env.DATA_PATH;
export const DATA_PATH = envDataPath
  ? path.resolve(envDataPath)
  : path.resolve(__dirname, "../../data");

export const ORDERS_PATH = path.join(DATA_PATH, "orders.json");
export const PRODUCTS_PATH = path.join(DATA_PATH, "products.json");
export const USERS_PATH = path.join(DATA_PATH, "users.json");
export const RATES_PATH = path.join(DATA_PATH, "rates.json");
export const PRICE_FORMATION_PATH = path.join(DATA_PATH, "price_formation.json");
export const BRANDS_PATH = path.join(DATA_PATH, "brands.json");