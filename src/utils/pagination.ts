import TelegramBot from "node-telegram-bot-api";
import { COMMON_TEXTS } from "../texts";
import { CALLBACK_TYPE, PAGINATION } from "../types";
import { buildCallbackData } from "./callbackBuilder";

export function paginate<T>(
	items: T[],
	page: number,
	perPage: number
) {
	const totalPages = Math.max(
		1,
		Math.ceil(items.length / perPage)
	);

	const currentPage = Math.min(
		Math.max(page, 1),
		totalPages
	);

	const start = (currentPage - 1) * perPage;
	const end = start + perPage;

	return {
		items: items.slice(start, end),
		currentPage,
		totalPages,
	};
}

export function paginationKeyboard(
  currentPage: number,
  totalPages: number,
  callbackPrefix: string
): TelegramBot.InlineKeyboardButton[][] {

  const row: TelegramBot.InlineKeyboardButton[] = [];

  if (currentPage > 1) {
    row.push({
      text: COMMON_TEXTS.PREV,
      // callback_data: `${callbackPrefix}:prev`,
      callback_data: buildCallbackData(callbackPrefix, PAGINATION.PREV),
    });
  }

  row.push({
    text: `стр. ${currentPage} из ${totalPages}`,
    // callback_data: `${callbackPrefix}:goto`,
    callback_data: buildCallbackData(callbackPrefix, PAGINATION.GOTO),
  });

  if (currentPage < totalPages) {
    row.push({
      text: COMMON_TEXTS.NEXT,
      // callback_data: `${callbackPrefix}:next`,
      callback_data: buildCallbackData(callbackPrefix, PAGINATION.NEXT),
    });
  }

  return [
    row,
    [
      {
        text: COMMON_TEXTS.BACK_BUTTON,
        callback_data: CALLBACK_TYPE.BACK,
      },
    ],
  ];
}

export function addPaginationButtons(
  currentPage: number,
  totalPages: number,
  callbackPrefix: string
): TelegramBot.InlineKeyboardButton[] {
  const buttons: TelegramBot.InlineKeyboardButton[] = [];

  if (currentPage > 1) {
    buttons.push({
      text: COMMON_TEXTS.PREV,
      // callback_data: `${callbackPrefix}:prev`,
      callback_data: buildCallbackData(callbackPrefix, PAGINATION.PREV),
    });
  }

  buttons.push({
    text: `стр. ${currentPage} из ${totalPages}`,
    // callback_data: `${callbackPrefix}:goto`,
    callback_data: buildCallbackData(callbackPrefix, PAGINATION.GOTO),
  });

  if (currentPage < totalPages) {
    buttons.push({
      text: COMMON_TEXTS.NEXT,
      // callback_data: `${callbackPrefix}:next`,
      callback_data: buildCallbackData(callbackPrefix, PAGINATION.NEXT),
    });
  }

  return buttons;
}
