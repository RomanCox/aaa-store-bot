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
import { cleanOldFiles } from "./utils";
import { TIME_LIMIT_DELETING_OLD_FILES, TMP_PATH } from "./constants";
import { loadProductCache } from "./services/products/products.service";
import { loadCatalog } from "./services/catalog/catalog.service";
import { loadColorsFromFile } from "./services/colors.service";
import { startAppleSimWatcher } from "./services/appleSimWatcher.service";
import { loadWarehouseFromFile } from "./services/warehouse.service";

async function bootstrap() {
  loadColorsFromFile();
	const bot = await createBot();

	loadUsers();
  loadProductCache();
  loadCatalog();
  loadRates();
	loadPriceFormation();
  loadOrdersFromFile();
  loadBrandsFromFile();
  loadWarehouseFromFile();

	registerStart(bot);
	registerMessages(bot);
	registerCallbacks(bot);
	registerDocumentHandler(bot);

  startAppleSimWatcher(bot);

  if (!fs.existsSync(TMP_PATH)) {
    fs.mkdirSync(TMP_PATH, { recursive: true });
  }

  await cleanOldFiles(TMP_PATH, 10, '.xlsx');

  setInterval(() => {
    cleanOldFiles(TMP_PATH, 10, '.xlsx').catch(console.error);
  }, TIME_LIMIT_DELETING_OLD_FILES);

  console.log("🤖 Bot started");
}

bootstrap().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

