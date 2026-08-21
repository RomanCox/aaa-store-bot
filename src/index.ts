import "dotenv/config";
import fs from "fs";
import { createBot } from "./bot";
import { loadUsers } from "./services/users.service";
import { registerStart } from "./handlers/start.handler";
import { registerCallbacks } from "./handlers/callback.handler";
import { registerMessages } from "./handlers/message.handler";
import { registerDocumentHandler } from "./handlers/document.handler";
import { loadPriceFormation, loadRates } from "./services/price.service";
import { loadOrdersFromFile } from "./services/orders.service";
import { loadBrandsFromFile } from "./services/brands.service";
import { cleanOldFiles } from "./utils/cleanOldFiles";
import { TIME_LIMIT_DELETING_OLD_FILES, TMP_PATH } from "./constants";
import { loadProductCache } from "./services/products/products.service";
import { loadCatalog } from "./services/catalog/catalog.service";
import { loadColorsFromFile } from "./services/colors.service";
import "./services/backup.service";

async function bootstrap() {
	const bot = await createBot();

	loadUsers();
  loadProductCache();
  loadCatalog();
  loadRates();
	loadPriceFormation();
  loadOrdersFromFile();
  loadBrandsFromFile();
  loadColorsFromFile();

	registerStart(bot);
	registerMessages(bot);
	registerCallbacks(bot);
	registerDocumentHandler(bot);

  if (!fs.existsSync(TMP_PATH)) {
    fs.mkdirSync(TMP_PATH, { recursive: true });
  }

  await cleanOldFiles(TMP_PATH, 10, '.xlsx');

  setInterval(() => {
    cleanOldFiles(TMP_PATH, 10, '.xlsx').catch(console.error);
  }, TIME_LIMIT_DELETING_OLD_FILES);
}

bootstrap().catch(console.error);

console.log("🤖 Bot started");

