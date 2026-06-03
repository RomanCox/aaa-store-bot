"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserInputHandler = deleteUserInputHandler;
const users_service_1 = require("../../services/users.service");
const texts_1 = require("../../texts");
const chat_state_1 = require("../../state/chat.state");
const types_1 = require("../../types");
const renderScreen_1 = require("../../render/renderScreen");
async function deleteUserInputHandler(bot, chatId, text) {
    const userIdToDelete = Number(text.trim());
    const state = (0, chat_state_1.getChatState)(chatId);
    const adminState = state.sections?.[types_1.SECTION.ADMIN_PANEL];
    if (!adminState)
        return;
    // проверка, что введено число
    if (Number.isNaN(userIdToDelete)) {
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: types_1.SECTION.ADMIN_PANEL,
            text: texts_1.USERS_ERRORS.ID_NUMBER,
            withBackButton: true,
        });
        return;
    }
    // нельзя удалить себя
    if (userIdToDelete === chatId) {
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: types_1.SECTION.ADMIN_PANEL,
            text: texts_1.USERS_ERRORS.DELETE_MYSELF,
            withBackButton: true,
        });
        return;
    }
    try {
        await (0, users_service_1.deleteUser)(userIdToDelete);
        // обновляем state после успешного удаления
        (0, chat_state_1.setChatState)(chatId, {
            sections: {
                ...state.sections,
                [types_1.SECTION.ADMIN_PANEL]: {
                    ...adminState,
                    flowStep: adminState.flowStep, // оставляем текущий flowStep
                },
            },
            mode: "idle",
        });
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: types_1.SECTION.ADMIN_PANEL,
            text: texts_1.USERS_TEXTS.DELETE_SUCCESSFUL,
            withBackButton: true,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            switch (error.message) {
                case texts_1.USERS_ERRORS.USER_NOT_FOUND:
                    await (0, renderScreen_1.renderScreen)(bot, chatId, {
                        section: types_1.SECTION.ADMIN_PANEL,
                        text: texts_1.USERS_ERRORS.USER_NOT_FOUND_MESSAGE,
                        withBackButton: true,
                    });
                    break;
                default:
                    await (0, renderScreen_1.renderScreen)(bot, chatId, {
                        section: types_1.SECTION.ADMIN_PANEL,
                        text: texts_1.USERS_ERRORS.CANT_DELETE_USER,
                        withBackButton: true,
                    });
                    break;
            }
        }
    }
}
