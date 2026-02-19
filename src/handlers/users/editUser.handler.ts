import TelegramBot from "node-telegram-bot-api";
import { getUser, isAdmin, isSuperAdmin } from "../../services/users.service";
import { ROLE_LABELS, USERS_ERRORS, USERS_TEXTS } from "../../texts";
import { setChatState } from "../../state/chat.state";
import { UserRole } from "../../types";
import { buildCallbackData } from "../../utils";
import { CALLBACK_TYPE } from "../../types";
import { COMMON_TEXTS } from "../../texts";
import { renderScreen } from "../../render/renderScreen";

export function editUserRoleKeyboard(isSuperAdmin: boolean) {
  const buttons: UserRole[] = isSuperAdmin
    ? ["retail", "wholesale", "admin", "superadmin"]
    : ["retail", "wholesale"];

  return [
    ...buttons.map(role => [
      {
        text: ROLE_LABELS[role],
        callback_data: buildCallbackData(CALLBACK_TYPE.NEW_ROLE_FOR_EXIST_USER, role),
      },
    ]),
    [
      {
        text: COMMON_TEXTS.BACK_BUTTON,
        callback_data: CALLBACK_TYPE.BACK,
      },
    ],
  ];
}

export async function editUserInputHandler(
  bot: TelegramBot,
  chatId: number,
  text: string
) {
  const userIdToEdit = Number(text.trim());

  if (Number.isNaN(userIdToEdit)) {
    await renderScreen(bot, chatId, USERS_ERRORS.ID_NUMBER);
    return;
  }

  if (userIdToEdit === chatId) {
    await renderScreen(bot, chatId, USERS_ERRORS.EDIT_MYSELF);
    return;
  }

  if (!isAdmin(chatId)) {
    await renderScreen(bot, chatId, USERS_ERRORS.ONLY_ADMIN);
    return;
  }

  const user = getUser(userIdToEdit);

  if (!user) {
    await renderScreen(bot, chatId, USERS_ERRORS.USER_NOT_FOUND_MESSAGE, [[{
      text: COMMON_TEXTS.BACK_BUTTON,
      callback_data: CALLBACK_TYPE.BACK,
    }]]);
    return;
  }

  setChatState(chatId, {
    editingUserId: userIdToEdit,
  });

  const isSuperAdminUser = isSuperAdmin(chatId);

  await renderScreen(bot, chatId, USERS_ERRORS.USER_NOT_FOUND_MESSAGE, editUserRoleKeyboard(isSuperAdminUser));
}