import TelegramBot from "node-telegram-bot-api";
import { getAllUsers } from "../../services/users.service";
import { paginate, paginationKeyboard } from "../../utils";
import { getChatState, setChatState } from "../../state/chat.state";
import { CALLBACK_TYPE, SECTION } from "../../types";
import { renderScreen } from "../../render/renderScreen";
import { ADMIN_TEXTS, USERS_TEXTS } from "../../texts";

const USERS_PER_PAGE = 5;

export async function showUsersList(
  bot: TelegramBot,
  chatId: number
) {
  const state = getChatState(chatId);

  // безопасный доступ к MAIN и users
  const mainState = state.sections?.[SECTION.ADMIN_PANEL] ?? {
    messageId: undefined,
    flowStep: "main",
    users: { page: 1, totalPages: 1, editingUserId: undefined, newUserId: undefined },
  };
  const usersState = mainState.users;

  // используем текущую страницу или 1
  const requestedPage = usersState.page ?? 1;

  const allUsers = getAllUsers();
  const { items, currentPage, totalPages } = paginate(
    allUsers,
    requestedPage,
    USERS_PER_PAGE
  );

  // сохраняем состояние users и flowStep
  setChatState(chatId, {
    sections: {
      ...state.sections,
      [SECTION.ADMIN_PANEL]: {
        ...mainState,
        flowStep: "users_list",
        users: {
          ...usersState,
          page: currentPage,
          totalPages,
        },
      },
    },
  });

  // если список пуст
  if (items.length === 0) {
    await renderScreen(bot, chatId, {
      section: SECTION.ADMIN_PANEL,
      text: USERS_TEXTS.USER_LIST_EMPTY,
      withBackButton: true,
    });
    return;
  }

  const text =
    `<b>${ADMIN_TEXTS.USERS_LIST}</b>\n\n` +
    items
      .map(
        (user) =>
          USERS_TEXTS.USER +
          `🆔 <code>${user.id}</code>\n` +
          `🔐 <b>${user.role}</b>\n`
      )
      .join("\n");

  await renderScreen(bot, chatId, {
    section: SECTION.ADMIN_PANEL,
    text,
    inlineKeyboard: paginationKeyboard(currentPage, totalPages, CALLBACK_TYPE.USERS_LIST),
    parse_mode: "HTML",
    withBackButton: true,
  });
}
