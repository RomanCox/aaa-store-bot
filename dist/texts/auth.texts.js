"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUTH_TEXTS = void 0;
exports.AUTH_TEXTS = {
    accessDenied: "⛔ Доступ пока не выдан",
    accessGranted: "✅ Доступ активирован",
    welcome: "Добро пожаловать! 🎉",
    notActivated: (userId) => `
👋 Привет!

Твой аккаунт пока не активирован.

Чтобы получить доступ, напиши нашему менеджеру и сообщи свой код: <code>${userId}</code>

Важно! Менеджеры никогда не продают товары в личных сообщениях.
Все заказы оформляются только через этого бота.
`,
};
