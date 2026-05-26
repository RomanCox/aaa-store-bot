"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelsKeyboard = modelsKeyboard;
const types_1 = require("../types");
const utils_1 = require("../utils");
const constants_1 = require("../constants");
function modelsKeyboard(models) {
    const keyboard = [];
    for (let i = 0; i < models.length; i += constants_1.BUTTONS_IN_RAW_FOR_MODELS_KEYBOARD) {
        keyboard.push(models.slice(i, i + constants_1.BUTTONS_IN_RAW_FOR_MODELS_KEYBOARD).map(model => ({
            text: model,
            callback_data: (0, utils_1.buildCallbackData)(types_1.CALLBACK_TYPE.MODEL, model),
        })));
    }
    return keyboard;
}
