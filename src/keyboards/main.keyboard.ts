import { ReplyKeyboardMarkup, KeyboardButton } from "node-telegram-bot-api";
import { MENU_TEXTS } from "../texts";
import { isAdmin } from "../services/users.service";

export function mainKeyboard(userId: number): ReplyKeyboardMarkup {
	const pricesButton: KeyboardButton = {text: MENU_TEXTS.CATALOG};
	const ordersButton: KeyboardButton = {text: MENU_TEXTS.ORDERS};
	const cartButton: KeyboardButton = {text: MENU_TEXTS.CART};
	const managerButton: KeyboardButton = {text: MENU_TEXTS.MANAGER};
  const adminPanelButton: KeyboardButton = {text: MENU_TEXTS.ADMIN_PANEL};

  const isUserAdmin = isAdmin(userId);

	return {
		keyboard: [
      [pricesButton, ordersButton, isUserAdmin ? cartButton : managerButton],
      [isUserAdmin ? adminPanelButton : cartButton]
		],
		resize_keyboard: true,
		one_time_keyboard: false,
	};
}