import "dotenv/config";

import { createBot } from "./bot";
import { loadUsers } from "./services/users.service";
import { registerStart } from "./handlers/start.handler";
import { registerCallbacks } from "./handlers/callback.handler";
import { registerMessages } from "./handlers/message.handler";
import { registerDocumentHandler } from "./handlers/document.handler";

async function bootstrap() {
	const bot = await createBot();

	loadUsers();

	registerStart(bot);
	registerMessages(bot);
	registerCallbacks(bot);
	registerDocumentHandler(bot)
}

bootstrap().catch(console.error);

console.log("🤖 Bot started");

