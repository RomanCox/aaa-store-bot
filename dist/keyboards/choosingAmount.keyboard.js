"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.choosingAmountKeyboard = choosingAmountKeyboard;
const types_1 = require("../types");
const utils_1 = require("../utils");
const constants_1 = require("../constants");
function choosingAmountKeyboard() {
    const keyboard = [];
    const numbers = Array.from({ length: constants_1.MAX_BUTTONS_FOR_AMOUNT_KEYBOARD }, (_, i) => i + 1);
    for (let i = 0; i < numbers.length; i += constants_1.BUTTONS_IN_RAW_FOR_AMOUNT_KEYBOARD) {
        keyboard.push(numbers.slice(i, i + constants_1.BUTTONS_IN_RAW_FOR_AMOUNT_KEYBOARD).map(num => ({
            text: String(num),
            callback_data: (0, utils_1.buildCallbackData)(types_1.CALLBACK_TYPE.CHOOSING_AMOUNT, String(num)),
        })));
    }
    return keyboard;
}
