"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartRootKeyboard = cartRootKeyboard;
const types_1 = require("../types");
const texts_1 = require("../texts");
function cartRootKeyboard(currentOrder = []) {
    const keyboard = [];
    if (!currentOrder.length) {
        keyboard.push([
            { text: texts_1.CART_TEXTS.ADD_POSITION, callback_data: types_1.CALLBACK_TYPE.ADD_ITEM_TO_CART },
        ]);
    }
    else {
        keyboard.push([
            {
                text: texts_1.CART_TEXTS.SUBMIT_ORDER,
                callback_data: types_1.CALLBACK_TYPE.SUBMIT_ORDER,
            },
        ]);
        keyboard.push([
            {
                text: texts_1.CART_TEXTS.ADD_POSITION,
                callback_data: types_1.CALLBACK_TYPE.ADD_ITEM_TO_CART,
            },
        ]);
        keyboard.push([
            {
                text: texts_1.CART_TEXTS.CHANGE_POSITION,
                callback_data: types_1.CALLBACK_TYPE.EDITING_ORDER,
            },
        ]);
        keyboard.push([
            {
                text: texts_1.CART_TEXTS.CLEAR_CART,
                callback_data: types_1.CALLBACK_TYPE.CLEAR_CART,
            },
        ]);
    }
    return keyboard;
}
