import TelegramBot from "node-telegram-bot-api";
import { ADMIN_TEXTS } from "../texts";
import { CALLBACK_TYPE } from "../types";
import { getChatState, setChatState } from "../state/chat.state";
import { SECTION } from "../types";
import { USERS_TEXTS } from "../texts";
import { renderScreen } from "../render/renderScreen";

export async function startXlsxUpload(bot: TelegramBot, chatId: number) {
  const state = getChatState(chatId);
  const mainState = state.sections?.[SECTION.MAIN];

  setChatState(chatId, {
    mode: "upload_xlsx",
    section: SECTION.MAIN,
    sections: {
      ...state.sections,
      [SECTION.MAIN]: {
        messageId: mainState?.messageId,
        users: mainState?.users ?? {},
        flowStep: "upload_xlsx",
      },
    },
  });

  await renderScreen(bot, chatId, {
    section: SECTION.MAIN,
    text: ADMIN_TEXTS.UPLOAD_XLSX_MESSAGE,
    parse_mode: "Markdown",
    withBackButton: true,
  });
}

export async function startUserManagement(bot: TelegramBot, chatId: number) {
  const state = getChatState(chatId);
  const mainState = state.sections?.[SECTION.MAIN];

  setChatState(chatId, {
    section: SECTION.MAIN,
    sections: {
      ...state.sections,
      [SECTION.MAIN]: {
        flowStep: "manage_users",
        messageId: mainState?.messageId,
        users: mainState?.users ?? {},
      },
    },
  });

  await renderScreen(bot, chatId, {
    section: SECTION.MAIN,
    text: ADMIN_TEXTS.MANAGE_USERS_MESSAGE,
    inlineKeyboard: [
      [{ text: ADMIN_TEXTS.ADD_USER_BTN, callback_data: CALLBACK_TYPE.ADD_USER }],
      [{ text: ADMIN_TEXTS.DELETE_USER_BTN, callback_data: CALLBACK_TYPE.DELETE_USER }],
      [{ text: ADMIN_TEXTS.EDIT_USER_BTN, callback_data: CALLBACK_TYPE.EDIT_USER }],
      [{ text: ADMIN_TEXTS.USERS_LIST, callback_data: CALLBACK_TYPE.USERS_LIST }],
    ],
    parse_mode: "Markdown",
    withBackButton: true,
  });
}

export async function addUser(bot: TelegramBot, chatId: number) {
  const state = getChatState(chatId);
  const mainState = state.sections?.[SECTION.MAIN];

  setChatState(chatId, {
    mode: "add_user",
    section: SECTION.MAIN,
    sections: {
      ...state.sections,
      [SECTION.MAIN]: {
        flowStep: "add_user",
        messageId: mainState?.messageId,
        users: mainState?.users ?? {},
      },
    },
  });

  await renderScreen(bot, chatId, {
    section: SECTION.MAIN,
    text: USERS_TEXTS.ENTER_ID_USER_ADD,
    withBackButton: true,
  });
}

export async function deleteUser(bot: TelegramBot, chatId: number) {
  const state = getChatState(chatId);
  const mainState = state.sections?.[SECTION.MAIN];

  setChatState(chatId, {
    mode: "delete_user",
    section: SECTION.MAIN,
    sections: {
      ...state.sections,
      [SECTION.MAIN]: {
        flowStep: "delete_user",
        messageId: mainState?.messageId,
        users: mainState?.users ?? {},
      },
    },
  });

  await renderScreen(bot, chatId, {
    section: SECTION.MAIN,
    text: USERS_TEXTS.ENTER_ID_USER_DELETE,
    withBackButton: true,
  });
}

export async function editUser(bot: TelegramBot, chatId: number) {
  const state = getChatState(chatId);
  const mainState = state.sections?.[SECTION.MAIN];

  setChatState(chatId, {
    mode: "edit_user",
    section: SECTION.MAIN,
    sections: {
      ...state.sections,
      [SECTION.MAIN]: {
        flowStep: "edit_user",
        messageId: mainState?.messageId,
        users: mainState?.users ?? {},
      },
    },
  });

  await renderScreen(bot, chatId, {
    section: SECTION.MAIN,
    text: USERS_TEXTS.ENTER_ID_USER_EDIT,
    withBackButton: true,
  });
}
