"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginate = paginate;
exports.paginationKeyboard = paginationKeyboard;
exports.addPaginationButtons = addPaginationButtons;
const texts_1 = require("../texts");
const types_1 = require("../types");
const callbackBuilder_1 = require("./callbackBuilder");
function paginate(items, page, perPage) {
    const totalPages = Math.max(1, Math.ceil(items.length / perPage));
    const currentPage = Math.min(Math.max(page, 1), totalPages);
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    return {
        items: items.slice(start, end),
        currentPage,
        totalPages,
    };
}
function paginationKeyboard(currentPage, totalPages, callbackPrefix) {
    const row = [];
    if (currentPage > 1) {
        row.push({
            text: texts_1.COMMON_TEXTS.PREV,
            callback_data: (0, callbackBuilder_1.buildCallbackData)(callbackPrefix, types_1.PAGINATION.PREV),
        });
    }
    row.push({
        text: `стр. ${currentPage} из ${totalPages}`,
        callback_data: (0, callbackBuilder_1.buildCallbackData)(callbackPrefix, types_1.PAGINATION.GOTO),
    });
    if (currentPage < totalPages) {
        row.push({
            text: texts_1.COMMON_TEXTS.NEXT,
            callback_data: (0, callbackBuilder_1.buildCallbackData)(callbackPrefix, types_1.PAGINATION.NEXT),
        });
    }
    return [
        row,
    ];
}
function addPaginationButtons(currentPage, totalPages, callbackPrefix) {
    const buttons = [];
    if (currentPage > 1) {
        buttons.push({
            text: texts_1.COMMON_TEXTS.PREV,
            callback_data: (0, callbackBuilder_1.buildCallbackData)(callbackPrefix, types_1.PAGINATION.PREV),
        });
    }
    buttons.push({
        text: `стр. ${currentPage} из ${totalPages}`,
        callback_data: (0, callbackBuilder_1.buildCallbackData)(callbackPrefix, types_1.PAGINATION.GOTO),
    });
    if (currentPage < totalPages) {
        buttons.push({
            text: texts_1.COMMON_TEXTS.NEXT,
            callback_data: (0, callbackBuilder_1.buildCallbackData)(callbackPrefix, types_1.PAGINATION.NEXT),
        });
    }
    return buttons;
}
