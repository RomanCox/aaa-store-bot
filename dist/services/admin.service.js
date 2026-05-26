"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startPriceUpload = startPriceUpload;
exports.startUserManagement = startUserManagement;
exports.addUser = addUser;
exports.deleteUser = deleteUser;
exports.editUser = editUser;
const texts_1 = require("../texts");
const types_1 = require("../types");
const chat_state_1 = require("../state/chat.state");
const types_2 = require("../types");
const texts_2 = require("../texts");
const renderScreen_1 = require("../render/renderScreen");
async function startPriceUpload(bot, chatId, flowStep) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const mainState = state.sections?.[types_2.SECTION.ADMIN_PANEL];
    (0, chat_state_1.setChatState)(chatId, {
        mode: "upload_xlsx",
        section: types_2.SECTION.ADMIN_PANEL,
        sections: {
            ...state.sections,
            [types_2.SECTION.ADMIN_PANEL]: {
                messageId: mainState?.messageId,
                users: mainState?.users ?? {},
                flowStep,
            },
        },
    });
    await (0, renderScreen_1.renderScreen)(bot, chatId, {
        section: types_2.SECTION.ADMIN_PANEL,
        text: texts_1.ADMIN_TEXTS.UPLOAD_XLSX_MESSAGE,
        parse_mode: "Markdown",
        withBackButton: true,
    });
}
async function startUserManagement(bot, chatId) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const mainState = state.sections?.[types_2.SECTION.ADMIN_PANEL];
    (0, chat_state_1.setChatState)(chatId, {
        section: types_2.SECTION.ADMIN_PANEL,
        sections: {
            ...state.sections,
            [types_2.SECTION.ADMIN_PANEL]: {
                flowStep: "manage_users",
                messageId: mainState?.messageId,
                users: mainState?.users ?? {},
            },
        },
    });
    await (0, renderScreen_1.renderScreen)(bot, chatId, {
        section: types_2.SECTION.ADMIN_PANEL,
        text: texts_1.ADMIN_TEXTS.MANAGE_USERS_MESSAGE,
        inlineKeyboard: [
            [{ text: texts_1.ADMIN_TEXTS.ADD_USER_BTN, callback_data: types_1.CALLBACK_TYPE.ADD_USER }],
            [{ text: texts_1.ADMIN_TEXTS.DELETE_USER_BTN, callback_data: types_1.CALLBACK_TYPE.DELETE_USER }],
            [{ text: texts_1.ADMIN_TEXTS.EDIT_USER_BTN, callback_data: types_1.CALLBACK_TYPE.EDIT_USER }],
            [{ text: texts_1.ADMIN_TEXTS.USERS_LIST, callback_data: types_1.CALLBACK_TYPE.USERS_LIST }],
        ],
        parse_mode: "Markdown",
        withBackButton: true,
    });
}
async function addUser(bot, chatId) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const mainState = state.sections?.[types_2.SECTION.ADMIN_PANEL];
    (0, chat_state_1.setChatState)(chatId, {
        mode: "add_user",
        section: types_2.SECTION.ADMIN_PANEL,
        sections: {
            ...state.sections,
            [types_2.SECTION.ADMIN_PANEL]: {
                flowStep: "add_user",
                messageId: mainState?.messageId,
                users: mainState?.users ?? {},
            },
        },
    });
    await (0, renderScreen_1.renderScreen)(bot, chatId, {
        section: types_2.SECTION.ADMIN_PANEL,
        text: texts_2.USERS_TEXTS.ENTER_ID_USER_ADD,
        withBackButton: true,
    });
}
async function deleteUser(bot, chatId) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const mainState = state.sections?.[types_2.SECTION.ADMIN_PANEL];
    (0, chat_state_1.setChatState)(chatId, {
        mode: "delete_user",
        section: types_2.SECTION.ADMIN_PANEL,
        sections: {
            ...state.sections,
            [types_2.SECTION.ADMIN_PANEL]: {
                flowStep: "delete_user",
                messageId: mainState?.messageId,
                users: mainState?.users ?? {},
            },
        },
    });
    await (0, renderScreen_1.renderScreen)(bot, chatId, {
        section: types_2.SECTION.ADMIN_PANEL,
        text: texts_2.USERS_TEXTS.ENTER_ID_USER_DELETE,
        withBackButton: true,
    });
}
async function editUser(bot, chatId) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const mainState = state.sections?.[types_2.SECTION.ADMIN_PANEL];
    (0, chat_state_1.setChatState)(chatId, {
        mode: "edit_user",
        section: types_2.SECTION.ADMIN_PANEL,
        sections: {
            ...state.sections,
            [types_2.SECTION.ADMIN_PANEL]: {
                flowStep: "edit_user",
                messageId: mainState?.messageId,
                users: mainState?.users ?? {},
            },
        },
    });
    await (0, renderScreen_1.renderScreen)(bot, chatId, {
        section: types_2.SECTION.ADMIN_PANEL,
        text: texts_2.USERS_TEXTS.ENTER_ID_USER_EDIT,
        withBackButton: true,
    });
}
