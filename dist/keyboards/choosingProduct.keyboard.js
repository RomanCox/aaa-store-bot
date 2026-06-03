"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.choosingProductKeyboard = choosingProductKeyboard;
const types_1 = require("../types");
const texts_1 = require("../texts");
const utils_1 = require("../utils");
const chat_state_1 = require("../state/chat.state");
const constants_1 = require("../constants");
function choosingProductKeyboard(chatId, products) {
    const keyboard = [];
    const state = (0, chat_state_1.getChatState)(chatId);
    for (let i = 0; i < products.length; i += constants_1.BUTTONS_IN_RAW_FOR_CHOOSING_PRODUCT_KEYBOARD) {
        keyboard.push(products.slice(i, i + constants_1.BUTTONS_IN_RAW_FOR_CHOOSING_PRODUCT_KEYBOARD).map((product, index) => ({
            text: String(i + index + 1),
            callback_data: (0, utils_1.buildCallbackData)(types_1.CALLBACK_TYPE.CHOOSING_PRODUCT, product.id),
        })));
    }
    const bottomRow = [
        { text: texts_1.COMMON_TEXTS.BACK_BUTTON, callback_data: (0, utils_1.buildCallbackData)(types_1.CALLBACK_TYPE.BACK, types_1.SECTION.CART) },
    ];
    if (state.sections.cart?.currentOrder?.length) {
        bottomRow.push({
            text: texts_1.CART_TEXTS.CHECK_CART,
            callback_data: types_1.CALLBACK_TYPE.CHECK_CART,
        });
    }
    keyboard.push(bottomRow);
    return keyboard;
}
