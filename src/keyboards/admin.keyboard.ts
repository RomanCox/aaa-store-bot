import { InlineKeyboardMarkup } from "node-telegram-bot-api";
import { ADMIN_TEXTS } from "../texts/admin.texts";

export function adminKeyboard(): InlineKeyboardMarkup {
	return {
		inline_keyboard: [
			[{ text: ADMIN_TEXTS.uploadXlsx, callback_data: "admin:upload_xlsx" }],
			[{ text: ADMIN_TEXTS.manageUsers, callback_data: "admin:manage_users" }],
		],
	};
}
