"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatState = getChatState;
exports.getSectionState = getSectionState;
exports.setChatState = setChatState;
exports.updateSectionState = updateSectionState;
const types_1 = require("../types");
const DEFAULT_CHAT_STATE = {
    section: types_1.SECTION.HOME,
    mode: "idle",
    activeMessageId: undefined,
    sections: {
        [types_1.SECTION.HOME]: {
            messageId: undefined,
        },
        [types_1.SECTION.CART]: {
            messageId: undefined,
            flowStep: "main",
            currentOrder: [],
        },
        [types_1.SECTION.CATALOG]: {
            messageId: undefined,
            flowStep: "brands",
            lastProductGroups: [],
        },
        [types_1.SECTION.ORDERS]: {
            messageId: undefined,
            flowStep: "main",
            page: 1,
            totalPages: 1,
            selectedUserId: undefined,
        },
        [types_1.SECTION.ADMIN_PANEL]: {
            messageId: undefined,
            flowStep: "main",
            users: {
                page: 1,
                totalPages: 1,
                editingUserId: undefined,
                newUserId: undefined,
            },
        },
    },
};
const chatState = new Map();
function getChatState(chatId) {
    if (!chatState.has(chatId)) {
        chatState.set(chatId, structuredClone(DEFAULT_CHAT_STATE));
    }
    return chatState.get(chatId);
}
function getSectionState(state, section) {
    return state.sections?.[section];
}
function setChatState(chatId, patch) {
    const current = getChatState(chatId);
    chatState.set(chatId, { ...current, ...patch });
}
function updateSectionState(chatId, section, updater) {
    const state = getChatState(chatId);
    const prevSectionState = state.sections[section];
    const updatedSectionState = updater(prevSectionState);
    setChatState(chatId, {
        sections: {
            ...state.sections,
            [section]: updatedSectionState,
        },
    });
}
