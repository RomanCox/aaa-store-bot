import { InlineKeyboardMarkup } from "node-telegram-bot-api";

export function mergeKeyboards(
	...keyboards: InlineKeyboardMarkup[]
): InlineKeyboardMarkup {
	return {
		inline_keyboard: keyboards.flatMap(k => k.inline_keyboard),
	};
}