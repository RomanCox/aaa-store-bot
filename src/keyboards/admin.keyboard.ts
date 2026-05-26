import { InlineKeyboardButton } from "node-telegram-bot-api";
import { ADMIN_TEXTS } from "../texts";
import { CALLBACK_TYPE } from "../types";
import { getRates } from "../services/price.service";

export function adminKeyboard(): InlineKeyboardButton[][] {
	const rates = getRates();

  return [
      [{text: ADMIN_TEXTS.AAA_STORE_PRICE, callback_data: CALLBACK_TYPE.AAA_STORE_PRICE}],
      [{text: ADMIN_TEXTS.TODAY_THERE_TOMORROW_HERE_PRICE, callback_data: CALLBACK_TYPE.TODAY_THERE_TOMORROW_HERE_PRICE}],
      [{text: ADMIN_TEXTS.MANAGE_USERS, callback_data: CALLBACK_TYPE.MANAGE_USERS}],
      [
        {
          text: ADMIN_TEXTS.EDIT_RUB_TO_BYN + rates.rub_to_byn,
          callback_data: CALLBACK_TYPE.EDIT_RUB_TO_BYN
        },
        {
          text: ADMIN_TEXTS.EDIT_RUB_TO_USD + rates.rub_to_usd,
          callback_data: CALLBACK_TYPE.EDIT_RUB_TO_USD
        },
        {
          text: ADMIN_TEXTS.EDIT_USD_TO_BYN + rates.usd_to_byn,
          callback_data: CALLBACK_TYPE.EDIT_USD_TO_BYN
        },
      ],
      [
        {
          text: ADMIN_TEXTS.RENEW_PRICE,
          callback_data: CALLBACK_TYPE.RENEW_PRICE
        },
      ],
      [
        {
          text: ADMIN_TEXTS.CHECK,
          callback_data: CALLBACK_TYPE.CHECK
        },
      ],
    ];
}
