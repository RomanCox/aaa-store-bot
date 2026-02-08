import TelegramBot from "node-telegram-bot-api";
import { PaginationRenderer } from "../types/pagination";
import { getChatState, setChatState } from "../state/chat.state";
import { clearChatMessages } from "./clearChatMessages";
import { showUsersList } from "../handlers/users/users.handler";
import { PAGINATION_TEXTS } from "../texts/pagination.texts";
import { COMMON_TEXTS } from "../texts/common.texts";
import { CALLBACK_TYPE } from "../types/actions";

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
): TelegramBot.InlineKeyboardMarkup {
  const buttons = [];

  if (currentPage > 1) {
    buttons.push({
      text: COMMON_TEXTS.PREV,
      callback_data: `${callbackPrefix}:prev`,
    });
  }

  buttons.push({
    text: `стр. ${currentPage} из ${totalPages}`,
    callback_data: `${callbackPrefix}:goto`,
  });

  if (currentPage < totalPages) {
    buttons.push({
      text: COMMON_TEXTS.NEXT,
      callback_data: `${callbackPrefix}:next`,
    })
  }

	return {
		inline_keyboard: [
			buttons,
			[{
				text: COMMON_TEXTS.BACK_BUTTON,
				callback_data: CALLBACK_TYPE.BACK,
			},]
		],
	};
}

export async function pageInputHandler(
	bot: TelegramBot,
	chatId: number,
	text: string
) {
	const page = Number(text);
	const state = getChatState(chatId);

	if (!Number.isInteger(page) || page < 1) {
		await bot.sendMessage(chatId, PAGINATION_TEXTS.ERROR_PAGE);
		return;
	}

	if (page < 1 || page > (state.totalPages ?? 0)) {
		await bot.sendMessage(
			chatId,
			`❌ Страница должна быть от 1 до ${state.totalPages}`
		);
		return;
	}

	setChatState(chatId, {
		page,
	});

	await clearChatMessages(bot, chatId);
	await showUsersList(bot, chatId);
}

export async function changePage(
	bot: TelegramBot,
	chatId: number,
	newPage: number,
	render: (page: number) => Promise<void>
) {
	setChatState(chatId, {
		page: newPage,
	});

	await clearChatMessages(bot, chatId);
	await render(newPage);
}
