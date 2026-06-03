"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editCartKeyboard = editCartKeyboard;
const types_1 = require("../types");
const utils_1 = require("../utils");
const chat_state_1 = require("../state/chat.state");
const constants_1 = require("../constants");
function editCartKeyboard(chatId) {
    const keyboard = [];
    const state = (0, chat_state_1.getChatState)(chatId);
    const cartState = state.sections?.[types_1.SECTION.CART];
    if (cartState?.currentOrder?.length) {
        for (let i = 0; i < cartState.currentOrder.length; i += constants_1.BUTTONS_IN_RAW_FOR_EDIT_CART_KEYBOARD) {
            keyboard.push(cartState.currentOrder.slice(i, i + constants_1.BUTTONS_IN_RAW_FOR_EDIT_CART_KEYBOARD).map((product, index) => ({
                text: String(i + index + 1),
                callback_data: (0, utils_1.buildCallbackData)(types_1.CALLBACK_TYPE.EDIT_CART_ITEM, product.id),
            })));
        }
    }
    return keyboard;
}
