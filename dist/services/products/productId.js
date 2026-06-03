"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
const crypto_1 = __importDefault(require("crypto"));
function normalizeIdPart(str) {
    if (!str)
        return "";
    return str.toLowerCase().replace(/\s+/g, "").trim();
}
function generateId(input) {
    const raw = [
        normalizeIdPart(input.brand),
        normalizeIdPart(input.category),
        // normalizeIdPart(input.rawName),
        normalizeIdPart(input.model),
        normalizeIdPart(input.storage),
        normalizeIdPart(input.color),
        normalizeIdPart(input.country),
        normalizeIdPart(input.sim),
        normalizeIdPart(input.activated === undefined ? "" : String(input.activated)),
        normalizeIdPart(input.connectivity),
        normalizeIdPart(input.chip),
        normalizeIdPart(input.displayFinish),
    ]
        .filter(Boolean)
        .join("|");
    return crypto_1.default.createHash("md5").update(raw).digest("hex").slice(0, 12);
}
