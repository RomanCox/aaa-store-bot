import TelegramBot from "node-telegram-bot-api";
import { setUserState } from "../state/user.state";
import { COMMON_TEXTS } from "../texts/common.texts";

export async function startXlsxUpload(bot: TelegramBot, chatId: number, userId: number) {
	setUserState(userId, {
		mode: "upload_xlsx",
	});

	await bot.sendMessage(
		chatId,
		"📎 *Загрузить XLSX*\n\n" +
		"Пожалуйста, отправьте файл в формате `.xlsx`.\n" +
		"После загрузки я обработаю данные.",
		{
			parse_mode: "Markdown",
		}
	);
}

export async function startUserManagement(bot: TelegramBot, chatId: number, userId: number) {
	setUserState(userId, {
		mode: "manage_users",
	});

	await bot.sendMessage(chatId, "👨‍💼 *Управление пользователями*\n\nВыберите действие:", {
		parse_mode: "Markdown",
		reply_markup: {
			inline_keyboard: [
				[
					{text: "➕ Добавить пользователя", callback_data: "admin:add_user"},
					{text: "➖ Удалить пользователя", callback_data: "admin:remove_user"},
				],
				[
					{text: "📋 Список пользователей", callback_data: "admin:users_list"},
				],
				[
					{text: COMMON_TEXTS.BACK_BUTTON, callback_data: "admin:back"},
				],
			],
		},
	});
}
