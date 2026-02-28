import TelegramBot from "node-telegram-bot-api";
import { getUser, isAdmin, isSuperAdmin } from "../../services/users.service";
import { ROLE_LABELS, USERS_ERRORS, USERS_TEXTS } from "../../texts";
import { getChatState, setChatState } from "../../state/chat.state";
import { CALLBACK_TYPE, SECTION, UserRole } from "../../types";
import { buildCallbackData } from "../../utils";
import { renderScreen } from "../../render/renderScreen";

export function addUserRoleKeyboard(isSuperAdmin: boolean) {
  const buttons: UserRole[] = isSuperAdmin
    ? ["retail", "wholesale", "admin", "superadmin"]
    : ["retail", "wholesale"];

  return [
    ...buttons.map(role => [
      {
        text: ROLE_LABELS[role],
        callback_data: buildCallbackData(CALLBACK_TYPE.ROLE_FOR_NEW_USER, role),
      },
    ]),
  ];
}

export async function addUserInputHandler(
  bot: TelegramBot,
  chatId: number,
  text: string
) {
  const state = getChatState(chatId);
  const mainState = state.sections?.[SECTION.MAIN];
  if (!mainState) return;

  const newUserId = Number(text.trim());

  if (Number.isNaN(newUserId)) {
    await renderScreen(bot, chatId, {
      section: SECTION.MAIN,
      text: USERS_ERRORS.ID_NUMBER,
      withBackButton: true,
    });
    return;
  }

  if (newUserId === chatId) {
    await renderScreen(bot, chatId, {
      section: SECTION.MAIN,
      text: USERS_ERRORS.ADD_MYSELF,
      withBackButton: true,
    });
    return;
  }

  if (!isAdmin(chatId)) {
    await renderScreen(bot, chatId, {
      section: SECTION.MAIN,
      text: USERS_ERRORS.ONLY_ADMIN,
      withBackButton: true,
    });
    return;
  }

  const user = getUser(newUserId);
  if (user) {
    await renderScreen(bot, chatId, {
      section: SECTION.MAIN,
      text: USERS_ERRORS.USER_EXIST,
      withBackButton: true,
    });
    return;
  }

  setChatState(chatId, {
    sections: {
      ...state.sections,
      [SECTION.MAIN]: {
        ...mainState,
        users: {
          ...mainState.users,
          newUserId,
        },
      },
    },
  });

  const isSuperAdminUser = isSuperAdmin(chatId);

  await renderScreen(bot, chatId, {
    section: SECTION.MAIN,
    text: USERS_TEXTS.CHOOSE_ROLE,
    inlineKeyboard: addUserRoleKeyboard(isSuperAdminUser),
    withBackButton: true,
  });
}