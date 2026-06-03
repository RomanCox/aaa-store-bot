"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callbackHashMap = void 0;
exports.setCallbackHash = setCallbackHash;
exports.getCallbackOriginal = getCallbackOriginal;
exports.callbackHashMap = new Map();
function setCallbackHash(hash, original) {
    exports.callbackHashMap.set(hash, original);
}
function getCallbackOriginal(hash) {
    return exports.callbackHashMap.get(hash);
}
