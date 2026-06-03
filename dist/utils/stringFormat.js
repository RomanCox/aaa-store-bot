"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringWithoutSpaces = stringWithoutSpaces;
function stringWithoutSpaces(str) {
    return str.trim().replace(/\s+/g, "_");
}
