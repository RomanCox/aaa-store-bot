import TelegramBot from "node-telegram-bot-api";
import { setUserState } from "../state/user.state";
import { COMMON_TEXTS } from "../texts/common.texts";
import { clearChatMessages } from "../utils/clearChatMessages";
import { ADMIN_TEXTS } from "../texts/admin.texts";
import { CALLBACK_TYPE } from "../types/actions";
import { getChatState, registerBotMessage, setChatState } from "../state/chat.state";
import { SECTION } from "../types/navigation";
import { USERS_TEXTS } from "../texts/users.texts";

export async function startXlsxUpload(bot: TelegramBot, chatId: number) {
	await clearChatMessages(bot, chatId);

	const msg = await bot.sendMessage(
		chatId,
		ADMIN_TEXTS.UPLOAD_XLSX_MESSAGE,
		{
			parse_mode: "Markdown",
			reply_markup: {
				inline_keyboard: [
					[
						{text: COMMON_TEXTS.BACK_BUTTON, callback_data: CALLBACK_TYPE.BACK},
					],
				],
			},
		},
	);

	setUserState(chatId, {
		mode: "upload_xlsx",
	});

	const prevState = getChatState(chatId);

	setChatState(chatId, {
		section: SECTION.UPLOAD_XLSX,
		messageIds: [...(prevState.messageIds ?? []), msg.message_id]
	})
}

export async function startUserManagement(bot: TelegramBot, chatId: number) {
	await clearChatMessages(bot, chatId);

	const msg = await bot.sendMessage(
		chatId,
		ADMIN_TEXTS.MANAGE_USERS_MESSAGE,
		{
			parse_mode: "Markdown",
			reply_markup: {
				inline_keyboard: [
					[{text: ADMIN_TEXTS.ADD_USER_BTN, callback_data: CALLBACK_TYPE.ADD_USER}],
          [{text: ADMIN_TEXTS.DELETE_USER_BTN, callback_data: CALLBACK_TYPE.DELETE_USER}],
          [{text: ADMIN_TEXTS.EDIT_USER_BTN, callback_data: CALLBACK_TYPE.EDIT_USER}],
					[{text: ADMIN_TEXTS.USERS_LIST, callback_data: CALLBACK_TYPE.USERS_LIST}],
					[
						{text: COMMON_TEXTS.BACK_BUTTON, callback_data: CALLBACK_TYPE.BACK},
					],
				],
			},
		}
	);

	const prevState = getChatState(chatId);

	setChatState(chatId, {
		section: SECTION.MANAGE_USERS,
		messageIds: [...(prevState.messageIds?? []), msg.message_id]
	});
}

export async function deleteUser(bot: TelegramBot, chatId: number) {
	setUserState(chatId, {
		mode: "delete_user",
	});

	const msg = await bot.sendMessage(
		chatId,
		USERS_TEXTS.ENTER_ID_USER_DELETE,
	);

	registerBotMessage(chatId, msg.message_id);
	return;
}

export async function editUser(bot: TelegramBot, chatId: number) {
  setUserState(chatId, {
    mode: "edit_user",
  });

  const msg = await bot.sendMessage(
    chatId,
    USERS_TEXTS.ENTER_ID_USER_EDIT,
  );

  registerBotMessage(chatId, msg.message_id);
  return;
}