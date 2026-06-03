"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainKeyboard = mainKeyboard;
const texts_1 = require("../texts");
const users_service_1 = require("../services/users.service");
function mainKeyboard(userId) {
    const pricesButton = { text: texts_1.MENU_TEXTS.CATALOG };
    const ordersButton = { text: texts_1.MENU_TEXTS.ORDERS };
    const cartButton = { text: texts_1.MENU_TEXTS.CART };
    const managerButton = { text: texts_1.MENU_TEXTS.MANAGER };
    const adminPanelButton = { text: texts_1.MENU_TEXTS.ADMIN_PANEL };
    const isUserAdmin = (0, users_service_1.isAdmin)(userId);
    return {
        keyboard: [
            [pricesButton, ordersButton, isUserAdmin ? cartButton : managerButton],
            [isUserAdmin ? adminPanelButton : cartButton]
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
    };
}
