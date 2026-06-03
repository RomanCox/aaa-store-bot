"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWelcomeText = getWelcomeText;
function getWelcomeText(name, isAdmin) {
    if (isAdmin) {
        return (`Добро пожаловать, ${name} 👋\n\n` +
            `Вы вошли как администратор.\n`);
    }
    return (`Приветствую в магазине электронных товаров, ${name} 👋\n\n` +
        `Здесь вы можете посмотреть актуальные цены и наличие.\n`);
}
