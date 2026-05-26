"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminKeyboard = adminKeyboard;
const texts_1 = require("../texts");
const types_1 = require("../types");
const price_service_1 = require("../services/price.service");
function adminKeyboard() {
    const rates = (0, price_service_1.getRates)();
    return [
        [{ text: texts_1.ADMIN_TEXTS.AAA_STORE_PRICE, callback_data: types_1.CALLBACK_TYPE.AAA_STORE_PRICE }],
        [{ text: texts_1.ADMIN_TEXTS.TODAY_THERE_TOMORROW_HERE_PRICE, callback_data: types_1.CALLBACK_TYPE.TODAY_THERE_TOMORROW_HERE_PRICE }],
        [{ text: texts_1.ADMIN_TEXTS.MANAGE_USERS, callback_data: types_1.CALLBACK_TYPE.MANAGE_USERS }],
        [
            {
                text: texts_1.ADMIN_TEXTS.EDIT_RUB_TO_BYN + rates.rub_to_byn,
                callback_data: types_1.CALLBACK_TYPE.EDIT_RUB_TO_BYN
            },
            {
                text: texts_1.ADMIN_TEXTS.EDIT_RUB_TO_USD + rates.rub_to_usd,
                callback_data: types_1.CALLBACK_TYPE.EDIT_RUB_TO_USD
            },
            {
                text: texts_1.ADMIN_TEXTS.EDIT_USD_TO_BYN + rates.usd_to_byn,
                callback_data: types_1.CALLBACK_TYPE.EDIT_USD_TO_BYN
            },
        ],
        [
            {
                text: texts_1.ADMIN_TEXTS.RENEW_PRICE,
                callback_data: types_1.CALLBACK_TYPE.RENEW_PRICE
            },
        ],
        [
            {
                text: texts_1.ADMIN_TEXTS.CHECK,
                callback_data: types_1.CALLBACK_TYPE.CHECK
            },
        ],
    ];
}
