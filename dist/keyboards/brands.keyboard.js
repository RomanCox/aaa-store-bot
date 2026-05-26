"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.brandsKeyboard = brandsKeyboard;
const types_1 = require("../types");
const texts_1 = require("../texts");
const utils_1 = require("../utils");
const texts_2 = require("../texts");
const constants_1 = require("../constants");
function brandsKeyboard(brands, options) {
    const keyboard = [];
    if (options?.withAllBtn) {
        keyboard.push([
            { text: texts_1.CATALOG_TEXTS.ALL, callback_data: (0, utils_1.buildCallbackData)(types_1.CALLBACK_TYPE.BRAND, types_1.CATALOG_VALUE.ALL) },
        ]);
    }
    for (let i = 0; i < brands.length; i += constants_1.BUTTONS_IN_RAW_FOR_BRANDS_KEYBOARD) {
        keyboard.push(brands.slice(i, i + constants_1.BUTTONS_IN_RAW_FOR_BRANDS_KEYBOARD).map(brand => ({
            text: brand,
            callback_data: (0, utils_1.buildCallbackData)(types_1.CALLBACK_TYPE.BRAND, brand),
        })));
    }
    if (options?.showBack) {
        keyboard.push([
            {
                text: texts_2.COMMON_TEXTS.BACK_BUTTON,
                callback_data: (0, utils_1.buildCallbackData)(types_1.CALLBACK_TYPE.BACK, types_1.SECTION.CATALOG),
            },
        ]);
    }
    if (options?.withDownloadBtn) {
        keyboard.push([{
                text: texts_1.CATALOG_TEXTS.DOWNLOAD_CATALOG,
                callback_data: options.downloadKey
            }]);
    }
    return keyboard;
}
