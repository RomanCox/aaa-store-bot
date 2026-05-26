"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_LABELS = exports.USERS_TEXTS = exports.USERS_ERRORS = void 0;
exports.USERS_ERRORS = {
    FAILED_LOAD: "Failed to load users.json",
    USER_NOT_FOUND: "User not found",
    USER_NOT_FOUND_MESSAGE: "❌ Пользователь не найден",
    USER_NOT_CHOOSE_MESSAGE: "❌ Пользователь не выбран",
    ENTER_NEW_USER_ID: "❌ Не введен ID нового пользователя",
    ID_NUMBER: "❌ ID должен быть числом",
    ADD_MYSELF: "❌ Нельзя добавить самого себя",
    USER_EXIST: "❌ Пользователь с таким ID уже есть",
    DELETE_MYSELF: "❌ Нельзя удалить самого себя",
    CANT_DELETE_USER: "❌ Не удалось удалить пользователя",
    CANT_EDIT_USER: "❌ Не удалось обновить роль пользователя",
    EDIT_MYSELF: "❌ Нельзя редактировать самого себя",
    ONLY_ADMIN: "❌ Только администратор может редактировать пользователей",
};
exports.USERS_TEXTS = {
    ENTER_ID_USER_ADD: "🆔 Введи ID пользователя, которого нужно добавить:",
    ENTER_ID_USER_DELETE: "🗑 Введи ID пользователя, которого нужно удалить:",
    ADD_SUCCESSFUL: "✅ Пользователь успешно добавлен",
    DELETE_SUCCESSFUL: "✅ Пользователь успешно удалён",
    ENTER_ID_USER_EDIT: "👤 Введи ID пользователя, которого нужно отредактировать:",
    CHOOSE_ROLE: "🔧 Выбери новую роль для пользователя:",
    ROLE_RENEWED: "✅ Роль пользователя обновлена: ",
    USER_LIST_EMPTY: "Список пользователей пуст.",
    USER: "👤 Пользователь:\n",
};
exports.ROLE_LABELS = {
    retail: "🛒 Розничный клиент",
    wholesale: "📦 Оптовый клиент",
    admin: "🛠 Админ",
    superadmin: "👑 Суперадмин",
};
