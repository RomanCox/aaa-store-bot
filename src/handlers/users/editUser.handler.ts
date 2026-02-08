import TelegramBot from "node-telegram-bot-api";
import { deleteUser, isAdmin } from "../../services/users.service";
import { setUserState } from "../../state/user.state";
import { USERS_ERRORS } from "../../texts/users.texts";

export async function editUserInputHandler(
	bot: TelegramBot,
	chatId: number,
	text: string
) {
	const userIdToEdit = Number(text.trim());

	if (Number.isNaN(userIdToEdit)) {
		await bot.sendMessage(chatId, USERS_ERRORS.ID_NUMBER);
		return;
	}

	if (userIdToEdit === chatId) {
		await bot.sendMessage(chatId, USERS_ERRORS.EDIT_MYSELF);
		return;
	}

  if (!isAdmin(chatId)) {
    await bot.sendMessage(chatId, USERS_ERRORS.ONLY_ADMIN);
    return;
  }

	try {
		await deleteUser(userIdToDelete);

		setUserState(chatId, { mode: "idle" });

		await bot.sendMessage(
			chatId,
			"✅ Пользователь успешно удалён"
		);
	} catch (error) {
		if (error instanceof Error) {
			switch (error.message) {
				case USERS_ERRORS.USER_NOT_FOUND:
					await bot.sendMessage(chatId, USERS_ERRORS.USER_NOT_FOUND_MESSAGE);
					break;

				default:
					await bot.sendMessage(
						chatId,
						"❌ Не удалось удалить пользователя"
					);
			}
		}
	}
}