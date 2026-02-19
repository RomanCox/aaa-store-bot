import TelegramBot from "node-telegram-bot-api";
import { getAllUsers } from "../../services/users.service";
import { paginate, paginationKeyboard } from "../../utils";
import { getChatState, setChatState } from "../../state/chat.state";
import { CALLBACK_TYPE } from "../../types";
import { renderScreen } from "../../render/renderScreen";
import { COMMON_TEXTS, USERS_TEXTS } from "../../texts";

const USERS_PER_PAGE = 5;

export async function openUsersList(
	bot: TelegramBot,
	chatId: number
) {
	const users = getAllUsers();
	const usersTotalPages = Math.max(
		1,
		Math.ceil(users.length / USERS_PER_PAGE)
	);

	setChatState(chatId, {
    usersPage: 1,
		usersTotalPages,
	});

	await showUsersList(bot, chatId);
}

export async function showUsersList(
  bot: TelegramBot,
  chatId: number
) {
  const state = getChatState(chatId);
  const requestedPage = state.usersPage ?? 1;

  const users = getAllUsers();
  const { items, currentPage, totalPages } = paginate(
    users,
    requestedPage,
    USERS_PER_PAGE
  );

  setChatState(chatId, {
    adminStep: "users_list",
    usersPage: currentPage,
    usersTotalPages: totalPages,
  });

  if (items.length === 0) {
    await renderScreen(
      bot,
      chatId,
      USERS_TEXTS.USER_LIST_EMPTY,
      [[{
        text: COMMON_TEXTS.BACK_BUTTON,
        callback_data: CALLBACK_TYPE.BACK,
      }]],
      "HTML"
    );
    return;
  }

  const text =
    `<b>Список пользователей</b>\n\n` +
    items
      .map(
        (user) =>
          USERS_TEXTS.USER +
          `🆔 <code>${user.id}</code>\n` +
          `🔐 <b>${user.role}</b>\n`
      )
      .join("\n");

  await renderScreen(
    bot,
    chatId,
    text,
    paginationKeyboard(
      currentPage,
      totalPages,
      CALLBACK_TYPE.USERS_LIST
    ),
    "HTML"
  );
}