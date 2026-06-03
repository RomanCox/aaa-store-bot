"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeColor = normalizeColor;
const COLOR_MAP = {
    black: "black",
    midnight: "black",
    jet: "black",
    white: "white",
    starlight: "white",
    blue: "blue",
    red: "red",
    green: "green",
    gold: "gold",
    silver: "gray",
    gray: "gray",
    grey: "gray",
    pink: "pink",
    purple: "purple",
};
function normalizeColor(value) {
    const v = value.toLowerCase().trim();
    // 1. прямое попадание
    if (COLOR_MAP[v])
        return COLOR_MAP[v];
    // 2. частичное совпадение (важно для Apple/Samsung)
    for (const key of Object.keys(COLOR_MAP)) {
        if (v.includes(key)) {
            return COLOR_MAP[key];
        }
    }
    return "other";
}
