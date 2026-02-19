import TelegramBot from "node-telegram-bot-api";
import { deleteUser } from "../../services/users.service";
import { USERS_ERRORS, USERS_TEXTS } from "../../texts";
import { setChatState } from "../../state/chat.state";
import { COMMON_TEXTS } from "../../texts";
import { CALLBACK_TYPE } from "../../types";
import { renderScreen } from "../../render/renderScreen";

export async function deleteUserInputHandler(
	bot: TelegramBot,
	chatId: number,
	text: string
) {
	const userIdToDelete = Number(text.trim());

	if (Number.isNaN(userIdToDelete)) {
    await renderScreen(bot, chatId, USERS_ERRORS.ID_NUMBER);
		return;
	}

	if (userIdToDelete === chatId) {
    await renderScreen(bot, chatId, USERS_ERRORS.DELETE_MYSELF);
		return;
	}

	try {
		await deleteUser(userIdToDelete);
		setChatState(chatId, { mode: "idle" });
    await renderScreen(
      bot,
      chatId,
      USERS_TEXTS.DELETE_SUCCESSFUL,
      [[{ text: COMMON_TEXTS.BACK_BUTTON, callback_data: CALLBACK_TYPE.BACK }]]
    );
	} catch (error) {
		if (error instanceof Error) {
			switch (error.message) {
				case USERS_ERRORS.USER_NOT_FOUND:
          await renderScreen(bot, chatId, USERS_ERRORS.USER_NOT_FOUND_MESSAGE, [[{
            text: COMMON_TEXTS.BACK_BUTTON,
            callback_data: CALLBACK_TYPE.BACK,
          }]]);
					break;

				default:
          await renderScreen(bot, chatId, USERS_ERRORS.CANT_DELETE_USER);
					break;
			}
		}
	}
}