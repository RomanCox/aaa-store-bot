import TelegramBot from "node-telegram-bot-api";
import { getUser, isAdmin, isSuperAdmin } from "../../services/users.service";
import { ROLE_LABELS, USERS_ERRORS, USERS_TEXTS } from "../../texts";
import { registerBotMessage, setChatState } from "../../state/chat.state";
import { UserRole } from "../../types";
import { buildCallbackData } from "../../utils";
import { CALLBACK_TYPE } from "../../types";
import { COMMON_TEXTS } from "../../texts";

export function addUserRoleKeyboard(isSuperAdmin: boolean) {
	const buttons: UserRole[] = isSuperAdmin
		? ["retail", "wholesale", "admin", "superadmin"]
		: ["retail", "wholesale"];

	return {
		inline_keyboard: [
			...buttons.map(role => [
				{
					text: ROLE_LABELS[role],
					callback_data: buildCallbackData(CALLBACK_TYPE.ROLE_FOR_NEW_USER, role),
				},
			]),
			[
				{
					text: COMMON_TEXTS.BACK_BUTTON,
					callback_data: CALLBACK_TYPE.BACK,
				},
			],
		],
	};
}

export async function addUserInputHandler(
	bot: TelegramBot,
	chatId: number,
	text: string
) {
	const newUserId = Number(text.trim());

	if (Number.isNaN(newUserId)) {
		const msg = await bot.sendMessage(chatId, USERS_ERRORS.ID_NUMBER);
		registerBotMessage(chatId, msg.message_id);

		return;
	}

	if (newUserId === chatId) {
		const msg = await bot.sendMessage(chatId, USERS_ERRORS.ADD_MYSELF);
		registerBotMessage(chatId, msg.message_id);

		return;
	}

	if (!isAdmin(chatId)) {
		const msg = await bot.sendMessage(chatId, USERS_ERRORS.ONLY_ADMIN);
		registerBotMessage(chatId, msg.message_id);

		return;
	}

	const user = getUser(newUserId);

	if (user) {
		const msg = await bot.sendMessage(
			chatId,
			USERS_ERRORS.USER_EXIST
		);
		registerBotMessage(chatId, msg.message_id);

		return;
	}

	setChatState(chatId, {
		newUserId: newUserId,
	});

	const isSuperAdminUser = isSuperAdmin(chatId);

	const msg = await bot.sendMessage(
		chatId,
		USERS_TEXTS.CHOOSE_ROLE,
		{
			reply_markup: addUserRoleKeyboard(isSuperAdminUser),
		}
	)
	registerBotMessage(chatId, msg.message_id);
}