"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SAVE_EVERY_NUMBER_ITEMS = exports.TODAY_THERE_TOMORROW_HERE_PRICE_DELIVERY = exports.COLORS_PATH = exports.BRANDS_PATH = exports.PRICE_FORMATION_PATH = exports.RATES_PATH = exports.USERS_PATH = exports.PRODUCTS_CACHE_PATH = exports.ORDERS_PATH = exports.DATA_PATH = exports.UI_VERSION = exports.BUTTONS_IN_RAW_FOR_EDIT_CART_KEYBOARD = exports.BUTTONS_IN_RAW_FOR_STORAGE_VALUES_KEYBOARD = exports.BUTTONS_IN_RAW_FOR_MODELS_KEYBOARD = exports.BUTTONS_IN_RAW_FOR_CHOOSING_PRODUCT_KEYBOARD = exports.BUTTONS_IN_RAW_FOR_BRANDS_KEYBOARD = exports.BUTTONS_IN_RAW_FOR_CATEGORIES_KEYBOARD = exports.BUTTONS_IN_RAW_FOR_AMOUNT_KEYBOARD = exports.MAX_BUTTONS_FOR_AMOUNT_KEYBOARD = exports.ORDERS_PER_PAGE = exports.USERS_PER_PAGE = exports.TELEGRAM_MESSAGE_LIMIT = exports.MAX_PRICE = exports.TIME_LIMIT_DELETING_OLD_FILES = void 0;
const path_1 = __importDefault(require("path"));
exports.TIME_LIMIT_DELETING_OLD_FILES = 60 * 60 * 1000;
exports.MAX_PRICE = 20000;
exports.TELEGRAM_MESSAGE_LIMIT = 3900;
exports.USERS_PER_PAGE = 5;
exports.ORDERS_PER_PAGE = 5;
exports.MAX_BUTTONS_FOR_AMOUNT_KEYBOARD = 10;
exports.BUTTONS_IN_RAW_FOR_AMOUNT_KEYBOARD = 5;
exports.BUTTONS_IN_RAW_FOR_CATEGORIES_KEYBOARD = 2;
exports.BUTTONS_IN_RAW_FOR_BRANDS_KEYBOARD = 2;
exports.BUTTONS_IN_RAW_FOR_CHOOSING_PRODUCT_KEYBOARD = 4;
exports.BUTTONS_IN_RAW_FOR_MODELS_KEYBOARD = 2;
exports.BUTTONS_IN_RAW_FOR_STORAGE_VALUES_KEYBOARD = 2;
exports.BUTTONS_IN_RAW_FOR_EDIT_CART_KEYBOARD = 5;
exports.UI_VERSION = 1;
const envDataPath = process.env.DATA_PATH;
exports.DATA_PATH = envDataPath
    ? path_1.default.resolve(envDataPath)
    : path_1.default.resolve(__dirname, "../../data");
exports.ORDERS_PATH = path_1.default.join(exports.DATA_PATH, "orders.json");
exports.PRODUCTS_CACHE_PATH = path_1.default.join(exports.DATA_PATH, "products-cache.json");
exports.USERS_PATH = path_1.default.join(exports.DATA_PATH, "users.json");
exports.RATES_PATH = path_1.default.join(exports.DATA_PATH, "rates.json");
exports.PRICE_FORMATION_PATH = path_1.default.join(exports.DATA_PATH, "price_formation.json");
exports.BRANDS_PATH = path_1.default.join(exports.DATA_PATH, "brands.json");
exports.COLORS_PATH = path_1.default.join(exports.DATA_PATH, "colors.json");
exports.TODAY_THERE_TOMORROW_HERE_PRICE_DELIVERY = 5;
exports.SAVE_EVERY_NUMBER_ITEMS = 100;
