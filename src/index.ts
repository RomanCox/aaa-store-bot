import "dotenv/config";
import fs from "fs";
import path from 'path';
import { createBot } from "./bot";
import { loadUsers } from "./services/users.service";
import { registerStart } from "./handlers/start.handler";
import { registerCallbacks } from "./handlers/callback.handler";
import { registerMessages } from "./handlers/message.handler";
import { registerDocumentHandler } from "./handlers/document.handler";
import { loadProducts } from "./services/products.service";
import { loadPriceFormation, loadRates } from "./services/price.service";
import { loadOrdersFromFile } from "./services/orders.service";
import { loadBrandsFromFile } from "./services/brands.service";
import { cleanOldFiles } from "./utils/cleanOldFiles";
import { TIME_LIMIT_DELETING_OLD_FILES } from "./constants";

const TMP_DIR = path.join(__dirname, '../tmp');

async function bootstrap() {
	const bot = await createBot();

	loadUsers();
	loadProducts();
  loadRates();
	loadPriceFormation();
  loadOrdersFromFile();
  loadBrandsFromFile();

	registerStart(bot);
	registerMessages(bot);
	registerCallbacks(bot);
	registerDocumentHandler(bot);

  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  }

  await cleanOldFiles('./tmp', 10, '.xlsx');

  setInterval(() => {
    cleanOldFiles('./tmp', 10, '.xlsx').catch(console.error);
  }, TIME_LIMIT_DELETING_OLD_FILES);
}

bootstrap().catch(console.error);

console.log("🤖 Bot started");

