import type { InlineKeyboardButton } from "node-telegram-bot-api";
import { CALLBACK_TYPE } from "../types";
import { COMMON_TEXTS, HELPER_TOPICS } from "../texts";
import { buildCallbackData } from "../utils";

export function helperKeyboard(): InlineKeyboardButton[][] {
  return [
    ...HELPER_TOPICS.map(topic => [{ text: topic.label, callback_data: buildCallbackData(CALLBACK_TYPE.HELPER_TOPIC, topic.id) }]),
    [{ text: COMMON_TEXTS.BACK_BUTTON, callback_data: CALLBACK_TYPE.HELPER_BACK }],
  ];
}
