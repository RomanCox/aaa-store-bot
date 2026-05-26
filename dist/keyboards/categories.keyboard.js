"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoriesKeyboard = categoriesKeyboard;
const types_1 = require("../types");
const texts_1 = require("../texts");
const texts_2 = require("../texts");
const utils_1 = require("../utils");
const constants_1 = require("../constants");
function categoriesKeyboard(categories, options) {
    const keyboard = [];
    if (options?.withAllBtn) {
        keyboard.push([
            { text: texts_2.CATALOG_TEXTS.ALL, callback_data: (0, utils_1.buildCallbackData)(types_1.CALLBACK_TYPE.CATEGORY, types_1.CATALOG_VALUE.ALL) },
        ]);
    }
    for (let i = 0; i < categories.length; i += constants_1.BUTTONS_IN_RAW_FOR_CATEGORIES_KEYBOARD) {
        keyboard.push(categories.slice(i, i + constants_1.BUTTONS_IN_RAW_FOR_CATEGORIES_KEYBOARD).map(cat => ({
            text: cat,
            callback_data: (0, utils_1.buildCallbackData)(types_1.CALLBACK_TYPE.CATEGORY, cat),
        })));
    }
    keyboard.push([{ text: texts_1.COMMON_TEXTS.BACK_BUTTON, callback_data: (0, utils_1.buildCallbackData)(types_1.CALLBACK_TYPE.BACK, types_1.SECTION.CATALOG) }]);
    if (options?.withDownloadBtn) {
        keyboard.push([{
                text: texts_2.CATALOG_TEXTS.DOWNLOAD_CATALOG,
                callback_data: options.downloadKey
            }]);
    }
    return keyboard;
}
