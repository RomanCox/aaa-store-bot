"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editUserRoleKeyboard = editUserRoleKeyboard;
exports.editUserInputHandler = editUserInputHandler;
const users_service_1 = require("../../services/users.service");
const texts_1 = require("../../texts");
const chat_state_1 = require("../../state/chat.state");
const types_1 = require("../../types");
const utils_1 = require("../../utils");
const renderScreen_1 = require("../../render/renderScreen");
function editUserRoleKeyboard(isSuperAdmin) {
    const buttons = isSuperAdmin
        ? ["retail", "wholesale", "admin", "superadmin"]
        : ["retail", "wholesale"];
    return [
        ...buttons.map(role => [
            {
                text: texts_1.ROLE_LABELS[role],
                callback_data: (0, utils_1.buildCallbackData)(types_1.CALLBACK_TYPE.NEW_ROLE_FOR_EXIST_USER, role),
            },
        ]),
    ];
}
async function editUserInputHandler(bot, chatId, text) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const adminState = state.sections?.[types_1.SECTION.ADMIN_PANEL];
    if (!adminState)
        return;
    const userIdToEdit = Number(text.trim());
    // проверка на число
    if (Number.isNaN(userIdToEdit)) {
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: types_1.SECTION.ADMIN_PANEL,
            text: texts_1.USERS_ERRORS.ID_NUMBER,
            withBackButton: true,
        });
        return;
    }
    // нельзя редактировать себя
    if (userIdToEdit === chatId) {
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: types_1.SECTION.ADMIN_PANEL,
            text: texts_1.USERS_ERRORS.EDIT_MYSELF,
            withBackButton: true,
        });
        return;
    }
    // только администратор может редактировать
    if (!(0, users_service_1.isAdmin)(chatId)) {
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: types_1.SECTION.ADMIN_PANEL,
            text: texts_1.USERS_ERRORS.ONLY_ADMIN,
            withBackButton: true,
        });
        return;
    }
    const user = (0, users_service_1.getUser)(userIdToEdit);
    if (!user) {
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: types_1.SECTION.ADMIN_PANEL,
            text: texts_1.USERS_ERRORS.USER_NOT_FOUND_MESSAGE,
            withBackButton: true,
        });
        return;
    }
    // сохраняем ID редактируемого пользователя в mainState.users
    (0, chat_state_1.setChatState)(chatId, {
        sections: {
            ...state.sections,
            [types_1.SECTION.ADMIN_PANEL]: {
                ...adminState,
                users: {
                    ...adminState.users,
                    editingUserId: userIdToEdit,
                },
            },
        },
    });
    const isSuperAdminUser = (0, users_service_1.isSuperAdmin)(chatId);
    await (0, renderScreen_1.renderScreen)(bot, chatId, {
        section: types_1.SECTION.ADMIN_PANEL,
        text: texts_1.USERS_TEXTS.CHOOSE_ROLE,
        inlineKeyboard: editUserRoleKeyboard(isSuperAdminUser),
        withBackButton: true,
    });
}
