import { InlineKeyboardButton } from "node-telegram-bot-api";
import { ADMIN_TEXTS } from "../texts";
import { CALLBACK_TYPE } from "../types";
import { getPriceFormation, getRates } from "../services/price.service";

export function adminKeyboard(): InlineKeyboardButton[][] {
	const rates = getRates();

  return [
      [{text: ADMIN_TEXTS.UPLOAD_XLSX, callback_data: CALLBACK_TYPE.UPLOAD_XLSX}],
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
      ],
      [
        {
          text: ADMIN_TEXTS.RENEW_PRICE,
          callback_data: CALLBACK_TYPE.RENEW_PRICE
        },
      ],
    ];
}
