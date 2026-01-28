import "dotenv/config";

import { createBot } from "./bot";
import { registerStart } from "./handlers/start.handler";
import { registerCallbacks } from "./handlers/callback.handler";
import { registerMessages } from "./handlers/message.handler";

async function bootstrap() {
	const bot = await createBot();

	registerStart(bot);
	registerMessages(bot);
	registerCallbacks(bot);
}

bootstrap().catch(console.error);

console.log("🤖 Bot started");

