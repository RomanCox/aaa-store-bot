"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageValuesKeyboard = storageValuesKeyboard;
const types_1 = require("../types");
const utils_1 = require("../utils");
const constants_1 = require("../constants");
function storageValuesKeyboard(storageValues) {
    const keyboard = [];
    for (let i = 0; i < storageValues.length; i += constants_1.BUTTONS_IN_RAW_FOR_STORAGE_VALUES_KEYBOARD) {
        keyboard.push(storageValues.slice(i, i + constants_1.BUTTONS_IN_RAW_FOR_STORAGE_VALUES_KEYBOARD).map(storageValue => ({
            text: storageValue,
            callback_data: (0, utils_1.buildCallbackData)(types_1.CALLBACK_TYPE.STORAGE, storageValue),
        })));
    }
    return keyboard;
}
