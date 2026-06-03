"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeKeyboards = mergeKeyboards;
function mergeKeyboards(...keyboards) {
    return {
        inline_keyboard: keyboards.flatMap(k => k.inline_keyboard),
    };
}
