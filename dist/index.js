"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const bot_1 = require("./bot");
const users_service_1 = require("./services/users.service");
const start_handler_1 = require("./handlers/start.handler");
const callback_handler_1 = require("./handlers/callback.handler");
const message_handler_1 = require("./handlers/message.handler");
const document_handler_1 = require("./handlers/document.handler");
const price_service_1 = require("./services/price.service");
const orders_service_1 = require("./services/orders.service");
const brands_service_1 = require("./services/brands.service");
const cleanOldFiles_1 = require("./utils/cleanOldFiles");
const constants_1 = require("./constants");
const products_service_1 = require("./services/products/products.service");
const catalog_service_1 = require("./services/catalog/catalog.service");
const colors_service_1 = require("./services/colors.service");
const TMP_DIR = path_1.default.join(__dirname, '../tmp');
async function bootstrap() {
    const bot = await (0, bot_1.createBot)();
    (0, users_service_1.loadUsers)();
    (0, products_service_1.loadProductCache)();
    (0, catalog_service_1.loadCatalog)();
    (0, price_service_1.loadRates)();
    (0, price_service_1.loadPriceFormation)();
    (0, orders_service_1.loadOrdersFromFile)();
    (0, brands_service_1.loadBrandsFromFile)();
    (0, colors_service_1.loadColorsFromFile)();
    (0, start_handler_1.registerStart)(bot);
    (0, message_handler_1.registerMessages)(bot);
    (0, callback_handler_1.registerCallbacks)(bot);
    (0, document_handler_1.registerDocumentHandler)(bot);
    if (!fs_1.default.existsSync(TMP_DIR)) {
        fs_1.default.mkdirSync(TMP_DIR, { recursive: true });
    }
    await (0, cleanOldFiles_1.cleanOldFiles)('./tmp', 10, '.xlsx');
    setInterval(() => {
        (0, cleanOldFiles_1.cleanOldFiles)('./tmp', 10, '.xlsx').catch(console.error);
    }, constants_1.TIME_LIMIT_DELETING_OLD_FILES);
}
bootstrap().catch(console.error);
console.log("🤖 Bot started");
