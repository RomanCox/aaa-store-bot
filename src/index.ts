import "dotenv/config";

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
}

bootstrap().catch(console.error);

console.log("🤖 Bot started");

