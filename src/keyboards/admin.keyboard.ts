import { InlineKeyboardMarkup } from "node-telegram-bot-api";
import { ADMIN_TEXTS } from "../texts/admin.texts";
import { CALLBACK_TYPE } from "../types/actions";

export function adminKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{text: ADMIN_TEXTS.UPLOAD_XLSX, callback_data: CALLBACK_TYPE.UPLOAD_XLSX}],
      [{text: ADMIN_TEXTS.MANAGE_USERS, callback_data: CALLBACK_TYPE.MANAGE_USERS}],
    ],
  };
}
