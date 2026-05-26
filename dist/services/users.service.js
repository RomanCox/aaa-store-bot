"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadUsers = loadUsers;
exports.getUser = getUser;
exports.getUserRole = getUserRole;
exports.getAllUsers = getAllUsers;
exports.createUser = createUser;
exports.deleteUser = deleteUser;
exports.updateUserRole = updateUserRole;
exports.isAllowed = isAllowed;
exports.isAdmin = isAdmin;
exports.isSuperAdmin = isSuperAdmin;
exports.usersPageInputHandler = usersPageInputHandler;
const fs_1 = __importDefault(require("fs"));
const types_1 = require("../types");
const texts_1 = require("../texts");
const chat_state_1 = require("../state/chat.state");
const users_handler_1 = require("../handlers/users/users.handler");
const renderScreen_1 = require("../render/renderScreen");
const constants_1 = require("../constants");
let users = new Map();
function loadUsers() {
    if (!fs_1.default.existsSync(constants_1.USERS_PATH)) {
        users = new Map();
        return;
    }
    try {
        const raw = JSON.parse(fs_1.default.readFileSync(constants_1.USERS_PATH, "utf-8"));
        users = new Map(raw.map((user) => [user.id, user]));
    }
    catch (e) {
        console.error(texts_1.USERS_ERRORS.FAILED_LOAD, e);
        users = new Map();
    }
}
function getUser(userId) {
    return users.get(userId);
}
function getUserRole(userId) {
    return users.get(userId)?.role;
}
function getAllUsers() {
    return Array.from(users.values());
}
async function createUser(user) {
    if (users.has(user.id)) {
        throw new Error(texts_1.USERS_ERRORS.USER_EXIST);
    }
    users.set(user.id, user);
    persist();
}
async function deleteUser(userId) {
    if (!users.has(userId)) {
        throw new Error(texts_1.USERS_ERRORS.USER_NOT_FOUND);
    }
    users.delete(userId);
    persist();
}
async function updateUserRole(userId, role) {
    const user = users.get(userId);
    if (!user)
        throw new Error(texts_1.USERS_ERRORS.USER_NOT_FOUND);
    user.role = role;
    persist();
}
function persist() {
    const data = Array.from(users.values());
    fs_1.default.writeFileSync(constants_1.USERS_PATH, JSON.stringify(data, null, 2), "utf-8");
}
function isAllowed(userId) {
    return users.has(userId);
}
function isAdmin(userId) {
    const role = users.get(userId)?.role;
    return role === "admin" || role === "superadmin";
}
function isSuperAdmin(userId) {
    return users.get(userId)?.role === "superadmin";
}
async function usersPageInputHandler(bot, chatId, text) {
    const page = Number(text);
    let state = (0, chat_state_1.getChatState)(chatId);
    // создаём дефолтное состояние MAIN при первом обращении
    if (!state.sections?.[types_1.SECTION.ADMIN_PANEL]) {
        (0, chat_state_1.setChatState)(chatId, {
            sections: {
                ...state.sections,
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
        });
        // получаем обновлённый state
        state = (0, chat_state_1.getChatState)(chatId);
    }
    const adminState = state.sections[types_1.SECTION.ADMIN_PANEL];
    const usersState = adminState.users;
    // проверка на число
    if (!Number.isInteger(page) || page < 1) {
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: types_1.SECTION.ADMIN_PANEL,
            text: texts_1.PAGINATION_TEXTS.ERROR_PAGE,
        });
        return;
    }
    // проверка на диапазон страниц
    const totalPages = usersState.totalPages ?? 0;
    if (page > totalPages) {
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: types_1.SECTION.ADMIN_PANEL,
            text: texts_1.PAGINATION_TEXTS.PAGE_FROM_TO + totalPages,
        });
        return;
    }
    // обновляем страницу
    (0, chat_state_1.setChatState)(chatId, {
        sections: {
            ...state.sections,
            [types_1.SECTION.ADMIN_PANEL]: {
                ...adminState,
                users: {
                    ...usersState,
                    page,
                },
            },
        },
    });
    // показываем список пользователей
    await (0, users_handler_1.showUsersList)(bot, chatId);
}
