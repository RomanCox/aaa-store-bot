import { InlineKeyboardButton } from "node-telegram-bot-api";
import { CALLBACK_TYPE, SECTION } from "../types";
import { buildCallbackData } from "../utils";
import { getChatState } from "../state/chat.state";
import { BUTTONS_IN_RAW_FOR_EDIT_CART_KEYBOARD } from "../constants";

export function editCartKeyboard(chatId: number): InlineKeyboardButton[][] {
  const keyboard: InlineKeyboardButton[][] = [];

  const state = getChatState(chatId);
  const cartState = state.sections?.[SECTION.CART];

  if (cartState?.currentOrder?.length) {
    for (let i = 0; i < cartState.currentOrder.length; i += BUTTONS_IN_RAW_FOR_EDIT_CART_KEYBOARD) {
      keyboard.push(
        cartState.currentOrder.slice(i, i + BUTTONS_IN_RAW_FOR_EDIT_CART_KEYBOARD).map((product, index) => ({
          text: String(i + index + 1),
          callback_data: buildCallbackData(CALLBACK_TYPE.EDIT_CART_ITEM, product.id),
        }))
      );
    }
  }

  return keyboard;
}