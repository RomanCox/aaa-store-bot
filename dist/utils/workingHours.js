"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWorkingHours = isWorkingHours;
exports.guardWorkingHours = guardWorkingHours;
const texts_1 = require("../texts");
const users_service_1 = require("../services/users.service");
function isWorkingHours() {
    const now = new Date();
    const minskTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Minsk" }));
    const hours = minskTime.getHours();
    // return hours >= 11 && hours < 21;
    return process.env.DEV ? true : hours >= 11 && hours < 21;
}
async function guardWorkingHours(bot, chatId, action) {
    if (!(0, users_service_1.isAdmin)(chatId) && !isWorkingHours()) {
        await bot.sendMessage(chatId, texts_1.COMMON_TEXTS.OUT_OF_WORK_MESSAGE);
        return;
    }
    return action();
}
