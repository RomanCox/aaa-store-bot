import TelegramBot from "node-telegram-bot-api";
import { getUser, isAdmin, isSuperAdmin } from "../../services/users.service";
import { ROLE_LABELS, USERS_ERRORS, USERS_TEXTS } from "../../texts";
import { getChatState, setChatState } from "../../state/chat.state";
import { CALLBACK_TYPE, SECTION, UserRole } from "../../types";
import { buildCallbackData } from "../../utils";
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
  ];
}

export async function editUserInputHandler(
  bot: TelegramBot,
  chatId: number,
  text: string
) {
  const state = getChatState(chatId);
  const adminState = state.sections?.[SECTION.ADMIN_PANEL];

  if (!adminState) return;

  const userIdToEdit = Number(text.trim());

  // проверка на число
  if (Number.isNaN(userIdToEdit)) {
    await renderScreen(bot, chatId, {
      section: SECTION.ADMIN_PANEL,
      text: USERS_ERRORS.ID_NUMBER,
      withBackButton: true,
    });
    return;
  }

  // нельзя редактировать себя
  if (userIdToEdit === chatId) {
    await renderScreen(bot, chatId, {
      section: SECTION.ADMIN_PANEL,
      text: USERS_ERRORS.EDIT_MYSELF,
      withBackButton: true,
    });
    return;
  }

  // только администратор может редактировать
  if (!isAdmin(chatId)) {
    await renderScreen(bot, chatId, {
      section: SECTION.ADMIN_PANEL,
      text: USERS_ERRORS.ONLY_ADMIN,
      withBackButton: true,
    });
    return;
  }

  const user = getUser(userIdToEdit);

  if (!user) {
    await renderScreen(bot, chatId, {
      section: SECTION.ADMIN_PANEL,
      text: USERS_ERRORS.USER_NOT_FOUND_MESSAGE,
      withBackButton: true,
    });
    return;
  }

  // сохраняем ID редактируемого пользователя в mainState.users
  setChatState(chatId, {
    sections: {
      ...state.sections,
      [SECTION.ADMIN_PANEL]: {
        ...adminState,
        users: {
          ...adminState.users,
          editingUserId: userIdToEdit,
        },
      },
    },
  });

  const isSuperAdminUser = isSuperAdmin(chatId);

  await renderScreen(bot, chatId, {
    section: SECTION.ADMIN_PANEL,
    text: USERS_TEXTS.CHOOSE_ROLE,
    inlineKeyboard: editUserRoleKeyboard(isSuperAdminUser),
    withBackButton: true,
  });
}