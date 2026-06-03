"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCallbackData = parseCallbackData;
const callbackHashMap_1 = require("../services/callbackHashMap");
function parseCallbackData(data) {
    const original = (0, callbackHashMap_1.getCallbackOriginal)(data);
    const source = original ?? data;
    const [action, ...params] = source.split("::");
    return {
        action,
        params,
    };
}
