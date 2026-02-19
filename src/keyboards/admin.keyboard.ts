import { InlineKeyboardButton } from "node-telegram-bot-api";
import { ADMIN_TEXTS } from "../texts";
import { CALLBACK_TYPE } from "../types";
import { getPriceFormation } from "../services/price.service";

export function adminKeyboard(): InlineKeyboardButton[][] {
	const priceFormation = getPriceFormation();

  return [
      [{text: ADMIN_TEXTS.UPLOAD_XLSX, callback_data: CALLBACK_TYPE.UPLOAD_XLSX}],
      [{text: ADMIN_TEXTS.MANAGE_USERS, callback_data: CALLBACK_TYPE.MANAGE_USERS}],
      [
        {
          text: ADMIN_TEXTS.EDIT_RUB_TO_BYN + priceFormation.rates.rub_to_byn,
          callback_data: CALLBACK_TYPE.EDIT_RUB_TO_BYN
        },
        {
          text: ADMIN_TEXTS.EDIT_RUB_TO_USD + priceFormation.rates.rub_to_usd,
          callback_data: CALLBACK_TYPE.EDIT_RUB_TO_USD
        },
      ],
      [
        {
          text: ADMIN_TEXTS.EDIT_RETAIL_MULT + priceFormation.multipliers.retail,
          callback_data: CALLBACK_TYPE.EDIT_RETAIL_MULT
        },
        {
          text: ADMIN_TEXTS.EDIT_WHOLESALE_MULT + priceFormation.multipliers.wholesale,
          callback_data: CALLBACK_TYPE.EDIT_WHOLESALE_MULT
        },
      ],
    ];
}
