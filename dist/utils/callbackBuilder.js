"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCallbackData = buildCallbackData;
const crypto_1 = __importDefault(require("crypto"));
const callbackHashMap_1 = require("../services/callbackHashMap");
function hashString(str) {
    return crypto_1.default.createHash('md5').update(str).digest('hex');
}
function buildCallbackData(...parts) {
    const raw = parts.filter(Boolean).join('::');
    const hash = hashString(raw);
    (0, callbackHashMap_1.setCallbackHash)(hash, raw);
    return hash;
}
