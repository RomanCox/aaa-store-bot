import { CALLBACK_TYPE, ChatMode } from "../types";
import { savePriceFormation } from "../services/price.service";
import { getChatState, registerBotMessage, setChatState } from "../state/chat.state";
import TelegramBot from "node-telegram-bot-api";
import { COMMON_TEXTS, PRICE_ERRORS, PRICE_TEXTS } from "../texts";

export async function editPriceInputHandler(
	bot: TelegramBot,
	chatId: number,
	value: string
) {
	if (Number.isNaN(value)) {
		const msg = await bot.sendMessage(chatId, PRICE_ERRORS.PRICE_FORMAT_ERROR);
		registerBotMessage(chatId, msg.message_id);

		return;
	}

	const numberValue = Number(value);

	const state = getChatState(chatId);

	let msg;

	if (
		!["edit_rub_to_byn", "edit_rub_to_usd", "edit_retail_mult", "edit_wholesale_mult"].includes(state.mode)
	) {
		msg = await bot.sendMessage(chatId, PRICE_ERRORS.ERROR_STATE + state.mode, {
			reply_markup: {
				inline_keyboard: [[{
					text: COMMON_TEXTS.BACK_BUTTON, callback_data: CALLBACK_TYPE.BACK
				}]]
			}
		});
		registerBotMessage(chatId, msg.message_id);
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

		msg = await bot.sendMessage(
			chatId,
			generateText(state.mode),
			{
				reply_markup: {
					inline_keyboard: [[{ text: COMMON_TEXTS.BACK_BUTTON, callback_data: CALLBACK_TYPE.BACK }]]
				}
			}
		);
		registerBotMessage(chatId, msg.message_id);
		return;
	} catch (error) {
		if (error instanceof Error) {
			msg = await bot.sendMessage(chatId, PRICE_ERRORS.ERROR_PRICE_FORMATION_EDIT,
				{
					reply_markup: {
						inline_keyboard: [[{
							text: COMMON_TEXTS.BACK_BUTTON,
							callback_data: CALLBACK_TYPE.BACK,
						}]]
					},
				});
		}
	}

	if (msg) {
		registerBotMessage(chatId, msg.message_id);
	}
}