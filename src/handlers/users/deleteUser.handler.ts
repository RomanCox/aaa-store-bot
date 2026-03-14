import TelegramBot from "node-telegram-bot-api";
import { deleteUser } from "../../services/users.service";
import { USERS_ERRORS, USERS_TEXTS } from "../../texts";
import { getChatState, setChatState } from "../../state/chat.state";
import { SECTION } from "../../types";
import { renderScreen } from "../../render/renderScreen";

export async function deleteUserInputHandler(
  bot: TelegramBot,
  chatId: number,
  text: string
) {
  const userIdToDelete = Number(text.trim());
  const state = getChatState(chatId);
  const adminState = state.sections?.[SECTION.ADMIN_PANEL];

  if (!adminState) return;

  // проверка, что введено число
  if (Number.isNaN(userIdToDelete)) {
    await renderScreen(bot, chatId, {
      section: SECTION.ADMIN_PANEL,
      text: USERS_ERRORS.ID_NUMBER,
      withBackButton: true,
    });
    return;
  }

  // нельзя удалить себя
  if (userIdToDelete === chatId) {
    await renderScreen(bot, chatId, {
      section: SECTION.ADMIN_PANEL,
      text: USERS_ERRORS.DELETE_MYSELF,
      withBackButton: true,
    });
    return;
  }

  try {
    await deleteUser(userIdToDelete);

    // обновляем state после успешного удаления
    setChatState(chatId, {
      sections: {
        ...state.sections,
        [SECTION.ADMIN_PANEL]: {
          ...adminState,
          flowStep: adminState.flowStep, // оставляем текущий flowStep
        },
      },
      mode: "idle",
    });

    await renderScreen(bot, chatId, {
      section: SECTION.ADMIN_PANEL,
      text: USERS_TEXTS.DELETE_SUCCESSFUL,
      withBackButton: true,
    });
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case USERS_ERRORS.USER_NOT_FOUND:
          await renderScreen(bot, chatId, {
            section: SECTION.ADMIN_PANEL,
            text: USERS_ERRORS.USER_NOT_FOUND_MESSAGE,
            withBackButton: true,
          });
          break;

        default:
          await renderScreen(bot, chatId, {
            section: SECTION.ADMIN_PANEL,
            text: USERS_ERRORS.CANT_DELETE_USER,
            withBackButton: true,
          });
          break;
      }
    }
  }
}
