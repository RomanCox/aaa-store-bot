import TelegramBot from "node-telegram-bot-api";
import { COMMON_TEXTS } from "../texts";
import { ADMIN_TEXTS } from "../texts";
import { CALLBACK_TYPE } from "../types";
import { setChatState } from "../state/chat.state";
import { SECTION } from "../types";
import { USERS_TEXTS } from "../texts";
import { renderScreen } from "../render/renderScreen";

export async function startXlsxUpload(bot: TelegramBot, chatId: number) {
  setChatState(chatId, {
    section: SECTION.UPLOAD_XLSX,
    mode: "upload_xlsx",
  })

  await renderScreen(
    bot,
    chatId,
    ADMIN_TEXTS.UPLOAD_XLSX_MESSAGE,
    [[
      {text: COMMON_TEXTS.BACK_BUTTON, callback_data: CALLBACK_TYPE.BACK},
    ]],
    "Markdown"
  );
}

export async function startUserManagement(bot: TelegramBot, chatId: number) {
  setChatState(chatId, {
    section: SECTION.MANAGE_USERS,
  });

  await renderScreen(
    bot,
    chatId,
    ADMIN_TEXTS.MANAGE_USERS_MESSAGE,
    [
      [{ text: ADMIN_TEXTS.ADD_USER_BTN, callback_data: CALLBACK_TYPE.ADD_USER }],
      [{ text: ADMIN_TEXTS.DELETE_USER_BTN, callback_data: CALLBACK_TYPE.DELETE_USER }],
      [{ text: ADMIN_TEXTS.EDIT_USER_BTN, callback_data: CALLBACK_TYPE.EDIT_USER }],
      [{ text: ADMIN_TEXTS.USERS_LIST, callback_data: CALLBACK_TYPE.USERS_LIST }],
      [{ text: COMMON_TEXTS.BACK_BUTTON, callback_data: CALLBACK_TYPE.BACK },],
    ],
    "Markdown",
  )
}

export async function addUser(bot: TelegramBot, chatId: number) {
  setChatState(chatId, {
    mode: "add_user",
    adminStep: "add_user",
  });

  await renderScreen(
    bot,
    chatId,
    USERS_TEXTS.ENTER_ID_USER_ADD,
    [[{
      text: COMMON_TEXTS.BACK_BUTTON, callback_data: CALLBACK_TYPE.BACK
    }]],
  );
}

export async function deleteUser(bot: TelegramBot, chatId: number) {
  setChatState(chatId, {
    mode: "delete_user",
    adminStep: "delete_user",
  });

  await renderScreen(
    bot,
    chatId,
    USERS_TEXTS.ENTER_ID_USER_DELETE,
    [[{
      text: COMMON_TEXTS.BACK_BUTTON, callback_data: CALLBACK_TYPE.BACK
    }]],
  );
}

export async function editUser(bot: TelegramBot, chatId: number) {
  setChatState(chatId, {
    mode: "edit_user",
    adminStep: "edit_user",
  });

  await renderScreen(
    bot,
    chatId,
    USERS_TEXTS.ENTER_ID_USER_EDIT,
    [[{
      text: COMMON_TEXTS.BACK_BUTTON, callback_data: CALLBACK_TYPE.BACK
    }]]
  );
}