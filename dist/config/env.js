"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = void 0;
function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is not defined`);
    }
    return value;
}
exports.ENV = {
    RETAIL_MANAGER_URL: requireEnv("RETAIL_MANAGER_URL"),
    WHOLESALE_MANAGER_URL: requireEnv("WHOLESALE_MANAGER_URL"),
};
