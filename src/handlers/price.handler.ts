import { SECTION } from "../types";
import { savePriceFormation } from "../services/price.service";
import { getChatState, setChatState } from "../state/chat.state";
import TelegramBot from "node-telegram-bot-api";
import { PRICE_ERRORS, PRICE_TEXTS } from "../texts";
import { renderScreen } from "../render/renderScreen";

export async function editPriceInputHandler(
  bot: TelegramBot,
  chatId: number,
  value: string
) {
  const numberValue = Number(value.trim());

  if (Number.isNaN(numberValue)) {
    await renderScreen(bot, chatId, {
      section: SECTION.MAIN,
      text: PRICE_ERRORS.PRICE_FORMAT_ERROR,
    });
    return;
  }

  const state = getChatState(chatId);

  const allowedModes = [
    "edit_rub_to_byn",
    "edit_rub_to_usd",
    "edit_retail_mult",
    "edit_wholesale_mult",
  ] as const;

  if (!allowedModes.includes(state.mode as any)) {
    await renderScreen(bot, chatId, {
      section: SECTION.MAIN,
      text: PRICE_ERRORS.ERROR_STATE + state.mode,
      withBackButton: true,
    });
    return;
  }

  try {
    await savePriceFormation({ type: state.mode, value: numberValue });

    setChatState(chatId, { mode: "idle" });

    // ✅ Типизируем только для конкретных allowedModes
    const successTexts: Record<typeof allowedModes[number], string> = {
      edit_rub_to_byn: PRICE_TEXTS.ENTER_RUB_TO_BYN_EDIT_SUCCESSFUL,
      edit_rub_to_usd: PRICE_TEXTS.ENTER_RUB_TO_USD_EDIT_SUCCESSFUL,
      edit_retail_mult: PRICE_TEXTS.ENTER_RETAIL_MULT_EDIT_SUCCESSFUL,
      edit_wholesale_mult: PRICE_TEXTS.ENTER_WHOLESALE_MULT_EDIT_SUCCESSFUL,
    };

    await renderScreen(bot, chatId, {
      section: SECTION.MAIN,
      text: successTexts[state.mode as typeof allowedModes[number]],
      withBackButton: true,
    });
  } catch (error) {
    if (error instanceof Error) {
      await renderScreen(bot, chatId, {
        section: SECTION.MAIN,
        text: PRICE_ERRORS.ERROR_PRICE_FORMATION_EDIT,
        withBackButton: true,
      });
    }
  }
}
