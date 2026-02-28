import TelegramBot from "node-telegram-bot-api";
import { deleteUser } from "../../services/users.service";
import { COMMON_TEXTS, USERS_ERRORS, USERS_TEXTS } from "../../texts";
import { getChatState, setChatState } from "../../state/chat.state";
import { CALLBACK_TYPE, SECTION } from "../../types";
import { renderScreen } from "../../render/renderScreen";

export async function deleteUserInputHandler(
  bot: TelegramBot,
  chatId: number,
  text: string
) {
  const userIdToDelete = Number(text.trim());
  const state = getChatState(chatId);
  const mainState = state.sections?.[SECTION.MAIN];

  if (!mainState) return;

  // проверка, что введено число
  if (Number.isNaN(userIdToDelete)) {
    await renderScreen(bot, chatId, {
      section: SECTION.MAIN,
      text: USERS_ERRORS.ID_NUMBER,
      withBackButton: true,
    });
    return;
  }

  // нельзя удалить себя
  if (userIdToDelete === chatId) {
    await renderScreen(bot, chatId, {
      section: SECTION.MAIN,
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
        [SECTION.MAIN]: {
          ...mainState,
          flowStep: mainState.flowStep, // оставляем текущий flowStep
        },
      },
      mode: "idle",
    });

    await renderScreen(bot, chatId, {
      section: SECTION.MAIN,
      text: USERS_TEXTS.DELETE_SUCCESSFUL,
      withBackButton: true,
    });
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case USERS_ERRORS.USER_NOT_FOUND:
          await renderScreen(bot, chatId, {
            section: SECTION.MAIN,
            text: USERS_ERRORS.USER_NOT_FOUND_MESSAGE,
            withBackButton: true,
          });
          break;

        default:
          await renderScreen(bot, chatId, {
            section: SECTION.MAIN,
            text: USERS_ERRORS.CANT_DELETE_USER,
            withBackButton: true,
          });
          break;
      }
    }
  }
}
