"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showUsersList = showUsersList;
const users_service_1 = require("../../services/users.service");
const utils_1 = require("../../utils");
const chat_state_1 = require("../../state/chat.state");
const types_1 = require("../../types");
const renderScreen_1 = require("../../render/renderScreen");
const texts_1 = require("../../texts");
const constants_1 = require("../../constants");
async function showUsersList(bot, chatId) {
    const state = (0, chat_state_1.getChatState)(chatId);
    // безопасный доступ к MAIN и users
    const mainState = state.sections?.[types_1.SECTION.ADMIN_PANEL] ?? {
        messageId: undefined,
        flowStep: "main",
        users: { page: 1, totalPages: 1, editingUserId: undefined, newUserId: undefined },
    };
    const usersState = mainState.users;
    // используем текущую страницу или 1
    const requestedPage = usersState.page ?? 1;
    const allUsers = (0, users_service_1.getAllUsers)();
    const { items, currentPage, totalPages } = (0, utils_1.paginate)(allUsers, requestedPage, constants_1.USERS_PER_PAGE);
    // сохраняем состояние users и flowStep
    (0, chat_state_1.setChatState)(chatId, {
        sections: {
            ...state.sections,
            [types_1.SECTION.ADMIN_PANEL]: {
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
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: types_1.SECTION.ADMIN_PANEL,
            text: texts_1.USERS_TEXTS.USER_LIST_EMPTY,
            withBackButton: true,
        });
        return;
    }
    const text = `<b>${texts_1.ADMIN_TEXTS.USERS_LIST}</b>\n\n` +
        items
            .map((user) => texts_1.USERS_TEXTS.USER +
            `🆔 <code>${user.id}</code>\n` +
            `🔐 <b>${user.role}</b>\n`)
            .join("\n");
    await (0, renderScreen_1.renderScreen)(bot, chatId, {
        section: types_1.SECTION.ADMIN_PANEL,
        text,
        inlineKeyboard: (0, utils_1.paginationKeyboard)(currentPage, totalPages, types_1.CALLBACK_TYPE.USERS_LIST),
        parse_mode: "HTML",
        withBackButton: true,
    });
}
