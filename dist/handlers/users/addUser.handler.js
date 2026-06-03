"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUserRoleKeyboard = addUserRoleKeyboard;
exports.addUserInputHandler = addUserInputHandler;
const users_service_1 = require("../../services/users.service");
const texts_1 = require("../../texts");
const chat_state_1 = require("../../state/chat.state");
const types_1 = require("../../types");
const utils_1 = require("../../utils");
const renderScreen_1 = require("../../render/renderScreen");
function addUserRoleKeyboard(isSuperAdmin) {
    const buttons = isSuperAdmin
        ? ["retail", "wholesale", "admin", "superadmin"]
        : ["retail", "wholesale"];
    return [
        ...buttons.map(role => [
            {
                text: texts_1.ROLE_LABELS[role],
                callback_data: (0, utils_1.buildCallbackData)(types_1.CALLBACK_TYPE.ROLE_FOR_NEW_USER, role),
            },
        ]),
    ];
}
async function addUserInputHandler(bot, chatId, text) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const mainState = state.sections?.[types_1.SECTION.ADMIN_PANEL];
    if (!mainState)
        return;
    const newUserId = Number(text.trim());
    if (Number.isNaN(newUserId)) {
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: types_1.SECTION.ADMIN_PANEL,
            text: texts_1.USERS_ERRORS.ID_NUMBER,
            withBackButton: true,
        });
        return;
    }
    if (newUserId === chatId) {
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: types_1.SECTION.ADMIN_PANEL,
            text: texts_1.USERS_ERRORS.ADD_MYSELF,
            withBackButton: true,
        });
        return;
    }
    if (!(0, users_service_1.isAdmin)(chatId)) {
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: types_1.SECTION.ADMIN_PANEL,
            text: texts_1.USERS_ERRORS.ONLY_ADMIN,
            withBackButton: true,
        });
        return;
    }
    const user = (0, users_service_1.getUser)(newUserId);
    if (user) {
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: types_1.SECTION.ADMIN_PANEL,
            text: texts_1.USERS_ERRORS.USER_EXIST,
            withBackButton: true,
        });
        return;
    }
    (0, chat_state_1.setChatState)(chatId, {
        sections: {
            ...state.sections,
            [types_1.SECTION.ADMIN_PANEL]: {
                ...mainState,
                users: {
                    ...mainState.users,
                    newUserId,
                },
            },
        },
    });
    const isSuperAdminUser = (0, users_service_1.isSuperAdmin)(chatId);
    await (0, renderScreen_1.renderScreen)(bot, chatId, {
        section: types_1.SECTION.ADMIN_PANEL,
        text: texts_1.USERS_TEXTS.CHOOSE_ROLE,
        inlineKeyboard: addUserRoleKeyboard(isSuperAdminUser),
        withBackButton: true,
    });
}
