"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleBack = handleBack;
const chat_state_1 = require("../state/chat.state");
const types_1 = require("../types");
const users_service_1 = require("../services/users.service");
async function handleBack(chatId) {
    const state = (0, chat_state_1.getChatState)(chatId);
    if (state.mode === "error") {
        const section = state.section;
        // 🔹 ADMIN
        if (section === types_1.SECTION.ADMIN_PANEL) {
            const adminState = state.sections?.[types_1.SECTION.ADMIN_PANEL];
            (0, chat_state_1.setChatState)(chatId, {
                mode: "idle",
                sections: {
                    ...state.sections,
                    [types_1.SECTION.ADMIN_PANEL]: {
                        ...adminState,
                        flowStep: "main",
                        users: adminState?.users ?? {
                            page: 1,
                            totalPages: 1,
                            editingUserId: undefined,
                            newUserId: undefined,
                        },
                    },
                },
            });
            return;
        }
        // 🔹 CATALOG
        if (section === types_1.SECTION.CATALOG) {
            (0, chat_state_1.setChatState)(chatId, {
                mode: "idle",
                sections: {
                    ...state.sections,
                    [types_1.SECTION.CATALOG]: {
                        flowStep: "brands",
                        selectedBrand: undefined,
                        selectedCategory: undefined,
                        lastProductGroups: [],
                    },
                },
            });
            return;
        }
        // 🔹 CART
        if (section === types_1.SECTION.CART) {
            (0, chat_state_1.setChatState)(chatId, {
                mode: "idle",
                sections: {
                    ...state.sections,
                    [types_1.SECTION.CART]: {
                        flowStep: "main",
                        selectedBrand: undefined,
                        selectedCategory: undefined,
                        selectedModel: undefined,
                        selectedStorage: undefined,
                        selectedProductId: undefined,
                        selectedProductIdForCart: undefined,
                    },
                },
            });
            return;
        }
        // 🔹 ORDERS
        if (section === types_1.SECTION.ORDERS) {
            (0, chat_state_1.setChatState)(chatId, {
                mode: (0, users_service_1.isAdmin)(chatId) ? "choose_userId_for_orders" : "idle",
                sections: {
                    ...state.sections,
                    [types_1.SECTION.ORDERS]: {
                        flowStep: "main",
                        selectedUserId: undefined,
                        page: 1,
                        totalPages: 1,
                    },
                },
            });
            return;
        }
    }
    const adminState = state.sections?.[types_1.SECTION.ADMIN_PANEL];
    if (!adminState)
        return;
    if (adminState.flowStep === "upload_aaa_store_price" || adminState.flowStep === "upload_today_there_tomorrow_here_price") {
        (0, chat_state_1.setChatState)(chatId, {
            mode: "idle",
            sections: {
                ...state.sections,
                [types_1.SECTION.ADMIN_PANEL]: {
                    ...adminState,
                    flowStep: "main",
                },
            },
        });
        return;
    }
    if (adminState.flowStep === "users_list" ||
        adminState.flowStep === "add_user" ||
        adminState.flowStep === "edit_user" ||
        adminState.flowStep === "delete_user") {
        (0, chat_state_1.setChatState)(chatId, {
            mode: "idle",
            sections: {
                ...state.sections,
                [types_1.SECTION.ADMIN_PANEL]: {
                    ...adminState,
                    flowStep: "manage_users",
                },
            },
        });
        return;
    }
    if (adminState.flowStep === "manage_users") {
        (0, chat_state_1.setChatState)(chatId, {
            sections: {
                ...state.sections,
                [types_1.SECTION.ADMIN_PANEL]: {
                    ...adminState,
                    flowStep: "main",
                },
            },
        });
        return;
    }
    if (state.section === types_1.SECTION.CATALOG) {
        const catalogState = state.sections?.[types_1.SECTION.CATALOG];
        if (!catalogState)
            return;
        switch (catalogState.flowStep) {
            // 🔹 Назад из брендов → в main
            case "brands":
                (0, chat_state_1.setChatState)(chatId, {
                    sections: {
                        ...state.sections,
                        [types_1.SECTION.CATALOG]: {
                            ...catalogState,
                            flowStep: "brands",
                            selectedBrand: undefined,
                            selectedCategory: undefined,
                        },
                    },
                    section: types_1.SECTION.ADMIN_PANEL,
                });
                return;
            // 🔹 Назад из категорий → к брендам
            case "categories":
                (0, chat_state_1.setChatState)(chatId, {
                    sections: {
                        ...state.sections,
                        [types_1.SECTION.CATALOG]: {
                            ...catalogState,
                            flowStep: "brands",
                            selectedBrand: undefined,
                            selectedCategory: undefined,
                        },
                    },
                });
                return;
            // 🔹 Назад из продуктов → к категориям
            case "products":
                (0, chat_state_1.setChatState)(chatId, {
                    sections: {
                        ...state.sections,
                        [types_1.SECTION.CATALOG]: {
                            ...catalogState,
                            flowStep: "categories",
                            selectedCategory: undefined,
                        },
                    },
                });
                return;
        }
    }
    if (state.section === types_1.SECTION.CART) {
        const cartState = state.sections?.[types_1.SECTION.CART];
        if (!cartState)
            return;
        switch (cartState.flowStep) {
            // 🔹 Назад из брендов → в main корзины
            case "brands":
                (0, chat_state_1.setChatState)(chatId, {
                    sections: {
                        ...state.sections,
                        [types_1.SECTION.CART]: {
                            ...cartState,
                            flowStep: "main",
                        },
                    },
                });
                return;
            // 🔹 Назад из категорий → к брендам
            case "categories":
                (0, chat_state_1.setChatState)(chatId, {
                    sections: {
                        ...state.sections,
                        [types_1.SECTION.CART]: {
                            ...cartState,
                            flowStep: "brands",
                            selectedBrand: undefined,
                        },
                    },
                });
                return;
            // 🔹 Назад из моделей → к категориям
            case "models":
                (0, chat_state_1.setChatState)(chatId, {
                    sections: {
                        ...state.sections,
                        [types_1.SECTION.CART]: {
                            ...cartState,
                            flowStep: "categories",
                            selectedCategory: undefined,
                        },
                    },
                });
                return;
            // 🔹 Назад из storage → к моделям
            case "storage":
                (0, chat_state_1.setChatState)(chatId, {
                    sections: {
                        ...state.sections,
                        [types_1.SECTION.CART]: {
                            ...cartState,
                            flowStep: "models",
                            selectedModel: undefined,
                        },
                    },
                });
                return;
            // 🔹 Назад из списка продуктов → к storage
            case "products_for_cart":
                (0, chat_state_1.setChatState)(chatId, {
                    sections: {
                        ...state.sections,
                        [types_1.SECTION.CART]: {
                            ...cartState,
                            flowStep: cartState.selectedStorage ? "storage" : "models",
                            selectedStorage: undefined,
                        },
                    },
                });
                return;
            // 🔹 Назад из ввода количества → к продуктам
            case "amount":
                (0, chat_state_1.setChatState)(chatId, {
                    sections: {
                        ...state.sections,
                        [types_1.SECTION.CART]: {
                            ...cartState,
                            flowStep: "products_for_cart",
                            selectedProductId: undefined,
                        },
                    },
                });
                return;
            // 🔹 Назад из редактирования корзины → в main корзины
            case "edit_cart":
                (0, chat_state_1.setChatState)(chatId, {
                    sections: {
                        ...state.sections,
                        [types_1.SECTION.CART]: {
                            ...cartState,
                            flowStep: "main",
                        },
                    },
                });
                return;
            // 🔹 Назад из редактирования конкретного товара → к edit_cart
            case "edit_product_in_cart":
                (0, chat_state_1.setChatState)(chatId, {
                    sections: {
                        ...state.sections,
                        [types_1.SECTION.CART]: {
                            ...cartState,
                            flowStep: "edit_cart",
                            selectedProductIdForCart: undefined,
                        },
                    },
                });
                return;
        }
    }
    if (state.section === types_1.SECTION.ORDERS) {
        const ordersState = state.sections?.[types_1.SECTION.ORDERS];
        if (!ordersState)
            return;
        if (ordersState.flowStep === "order") {
            (0, chat_state_1.setChatState)(chatId, {
                sections: {
                    ...state.sections,
                    [types_1.SECTION.ORDERS]: {
                        ...ordersState,
                        flowStep: "orders",
                    },
                },
            });
            return;
        }
        else {
            (0, chat_state_1.setChatState)(chatId, {
                mode: "choose_userId_for_orders",
                sections: {
                    ...state.sections,
                    [types_1.SECTION.ORDERS]: {
                        ...ordersState,
                        flowStep: "main",
                    },
                },
            });
            return;
        }
    }
    return;
}
