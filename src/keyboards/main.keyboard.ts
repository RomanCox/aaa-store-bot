import { ReplyKeyboardMarkup, KeyboardButton } from "node-telegram-bot-api";
import { MENU_TEXTS } from "../texts/menu.texts";

export function mainKeyboard(): ReplyKeyboardMarkup {
	const pricesButton: KeyboardButton = {text: MENU_TEXTS.CATALOG};
	const ordersButton: KeyboardButton = {text: MENU_TEXTS.ORDERS};
	const cartButton: KeyboardButton = {text: MENU_TEXTS.CART};
	const balanceButton: KeyboardButton = {text: MENU_TEXTS.BALANCE};
	const managerButton: KeyboardButton = {text: MENU_TEXTS.MANAGER};
	const settingsButton: KeyboardButton = {text: MENU_TEXTS.SETTINGS};

	return {
		keyboard: [
			[pricesButton, ordersButton, cartButton],
			[balanceButton, managerButton, settingsButton],
		],
		resize_keyboard: true,
		one_time_keyboard: false,
	};
}