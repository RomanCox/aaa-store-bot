"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editProductInCartKeyboard = editProductInCartKeyboard;
const types_1 = require("../types");
const texts_1 = require("../texts");
function editProductInCartKeyboard(productAmount) {
    const keyboard = [];
    keyboard.push([
        { text: texts_1.COMMON_TEXTS.PLUS_BUTTON, callback_data: types_1.CALLBACK_TYPE.INCREASE_AMOUNT },
    ]);
    if (productAmount > 1) {
        keyboard.push([
            { text: texts_1.COMMON_TEXTS.MINUS_BUTTON, callback_data: types_1.CALLBACK_TYPE.DECREASE_AMOUNT },
        ]);
    }
    keyboard.push([
        { text: texts_1.CART_TEXTS.DELETE_POSITION, callback_data: types_1.CALLBACK_TYPE.DELETE_POSITION_FROM_CART },
    ]);
    return keyboard;
}
