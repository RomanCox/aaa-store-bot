import { COMMON_TEXTS } from "../texts/common.texts";
import { CallbackType } from "../types/actions";

export function backKeyboard() {
  return {
    inline_keyboard: [
      [{ text: COMMON_TEXTS.backButton, callback_data: CallbackType.Back }]
    ]
  };
}
