import { CALLBACK_TYPE, ChatMode } from "../types";
import { savePriceFormation } from "../services/price.service";
import { getChatState, setChatState } from "../state/chat.state";
import TelegramBot from "node-telegram-bot-api";
import { COMMON_TEXTS, PRICE_ERRORS, PRICE_TEXTS } from "../texts";
import { renderScreen } from "../render/renderScreen";

export async function editPriceInputHandler(
	bot: TelegramBot,
	chatId: number,
	value: string
) {
	if (Number.isNaN(value)) {
    await renderScreen(bot, chatId, PRICE_ERRORS.PRICE_FORMAT_ERROR);
		return;
	}

	const numberValue = Number(value);

	const state = getChatState(chatId);

	if (
		!["edit_rub_to_byn", "edit_rub_to_usd", "edit_retail_mult", "edit_wholesale_mult"].includes(state.mode)
	) {
    await renderScreen(bot, chatId, PRICE_ERRORS.ERROR_STATE + state.mode, [[{
      text: COMMON_TEXTS.BACK_BUTTON, callback_data: CALLBACK_TYPE.BACK
    }]]);
		return;
	}

	try {
		await savePriceFormation({ type: state.mode, value: numberValue });

		setChatState(chatId, { mode: "idle" });

		const generateText = (mode: ChatMode) => {
			let result = PRICE_TEXTS.ENTER_RUB_TO_BYN_EDIT_SUCCESSFUL;

			switch (mode) {
				case "edit_rub_to_byn":
					result = PRICE_TEXTS.ENTER_RUB_TO_BYN_EDIT_SUCCESSFUL;
					break;

				case "edit_rub_to_usd":
					result = PRICE_TEXTS.ENTER_RUB_TO_USD_EDIT_SUCCESSFUL;
					break;

				case "edit_retail_mult":
					result = PRICE_TEXTS.ENTER_RETAIL_MULT_EDIT_SUCCESSFUL;
					break;

				case "edit_wholesale_mult":
					result = PRICE_TEXTS.ENTER_WHOLESALE_MULT_EDIT_SUCCESSFUL;
					break;
			}

			return result;
		}

    await renderScreen(bot, chatId, generateText(state.mode), [[{
      text: COMMON_TEXTS.BACK_BUTTON, callback_data: CALLBACK_TYPE.BACK
    }]]);
	} catch (error) {
		if (error instanceof Error) {
      await renderScreen(bot, chatId, PRICE_ERRORS.ERROR_PRICE_FORMATION_EDIT, [[{
        text: COMMON_TEXTS.BACK_BUTTON, callback_data: CALLBACK_TYPE.BACK,
      }]]);
		}
	}
}