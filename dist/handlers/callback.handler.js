"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCallbacks = registerCallbacks;
const types_1 = require("../types");
const chat_state_1 = require("../state/chat.state");
const renderFlow_1 = require("../render/renderFlow");
const utils_1 = require("../utils");
const back_handler_1 = require("./back.handler");
const admin_service_1 = require("../services/admin.service");
const renderProductsList_1 = require("../render/renderProductsList");
const users_handler_1 = require("./users/users.handler");
const texts_1 = require("../texts");
const users_service_1 = require("../services/users.service");
const orders_service_1 = require("../services/orders.service");
const orders_handler_1 = require("./orders.handler");
const renderScreen_1 = require("../render/renderScreen");
const price_service_1 = require("../services/price.service");
const sheets_service_1 = require("../services/sheets.service");
const renderSection_1 = require("../render/renderSection");
const reports_1 = require("../render/reports");
const catalog_hanlder_1 = require("./catalog.hanlder");
const catalog_ui_1 = require("../services/catalog/ui/catalog.ui");
const catalog_builder_1 = require("../services/catalog/catalog.builder");
const products_service_1 = require("../services/products/products.service");
const ADMIN_CHAT_ID = Number(process.env.ADMIN_CHAT_ID);
function registerCallbacks(bot) {
    bot.on("callback_query", async (query) => {
        const chatId = query.message?.chat.id;
        const data = query.data;
        if (!chatId || !data)
            return;
        await bot.answerCallbackQuery(query.id);
        const parsed = (0, utils_1.parseCallbackData)(data);
        const { action, params } = parsed;
        switch (action) {
            case types_1.CALLBACK_TYPE.BACK: {
                return (0, utils_1.guardWorkingHours)(bot, chatId, async () => {
                    await (0, back_handler_1.handleBack)(chatId);
                    await (0, renderSection_1.renderSection)(bot, chatId);
                    return;
                });
            }
            case types_1.CALLBACK_TYPE.AAA_STORE_PRICE: {
                await (0, admin_service_1.startPriceUpload)(bot, chatId, "upload_aaa_store_price");
                return;
            }
            case types_1.CALLBACK_TYPE.TODAY_THERE_TOMORROW_HERE_PRICE: {
                await (0, admin_service_1.startPriceUpload)(bot, chatId, "upload_today_there_tomorrow_here_price");
                return;
            }
            case types_1.CALLBACK_TYPE.MANAGE_USERS: {
                await (0, admin_service_1.startUserManagement)(bot, chatId);
                return;
            }
            case types_1.CALLBACK_TYPE.USERS_LIST: {
                const paramValue = params[0];
                const state = (0, chat_state_1.getChatState)(chatId);
                const adminState = state.sections?.[types_1.SECTION.ADMIN_PANEL];
                if (!adminState)
                    return;
                let page = adminState.users?.page ?? 1;
                if (adminState.flowStep === "users_list") {
                    if (paramValue === "next")
                        page++;
                    if (paramValue === "prev")
                        page--;
                    // 👉 GOTO
                    if (paramValue === "goto") {
                        (0, chat_state_1.setChatState)(chatId, {
                            mode: "await_users_page_number",
                        });
                        await (0, renderScreen_1.renderScreen)(bot, chatId, {
                            section: types_1.SECTION.ADMIN_PANEL,
                            text: texts_1.PAGINATION_TEXTS.ENTER_PAGE_NUMBER,
                            parse_mode: "HTML",
                            withBackButton: true,
                        });
                        return;
                    }
                }
                (0, chat_state_1.setChatState)(chatId, {
                    sections: {
                        ...state.sections,
                        [types_1.SECTION.ADMIN_PANEL]: {
                            ...adminState,
                            flowStep: "users_list",
                            users: {
                                ...adminState.users,
                                page,
                            },
                        },
                    },
                });
                await (0, users_handler_1.showUsersList)(bot, chatId);
                return;
            }
            case types_1.CALLBACK_TYPE.ADD_USER: {
                await (0, admin_service_1.addUser)(bot, chatId);
                return;
            }
            case types_1.CALLBACK_TYPE.DELETE_USER: {
                await (0, admin_service_1.deleteUser)(bot, chatId);
                return;
            }
            case types_1.CALLBACK_TYPE.EDIT_USER: {
                await (0, admin_service_1.editUser)(bot, chatId);
                return;
            }
            case types_1.CALLBACK_TYPE.ROLE_FOR_NEW_USER: {
                const role = params[0];
                const state = (0, chat_state_1.getChatState)(chatId);
                const mainState = state.sections?.[types_1.SECTION.ADMIN_PANEL];
                if (!mainState || mainState.flowStep !== "add_user" || !mainState.users.newUserId) {
                    await (0, renderScreen_1.renderScreen)(bot, chatId, {
                        section: types_1.SECTION.ADMIN_PANEL,
                        text: texts_1.USERS_ERRORS.USER_NOT_CHOOSE_MESSAGE,
                    });
                    return;
                }
                await (0, users_service_1.createUser)({ id: mainState.users.newUserId, role });
                (0, chat_state_1.setChatState)(chatId, {
                    mode: "idle",
                    sections: {
                        ...state.sections,
                        [types_1.SECTION.ADMIN_PANEL]: {
                            ...mainState,
                            users: {
                                ...mainState.users,
                                newUserId: undefined,
                            },
                        },
                    },
                });
                await (0, renderScreen_1.renderScreen)(bot, chatId, {
                    section: types_1.SECTION.ADMIN_PANEL,
                    text: texts_1.USERS_TEXTS.ADD_SUCCESSFUL,
                    withBackButton: true,
                });
                return;
            }
            case types_1.CALLBACK_TYPE.NEW_ROLE_FOR_EXIST_USER: {
                const role = params[0];
                const state = (0, chat_state_1.getChatState)(chatId);
                const mainState = state.sections?.[types_1.SECTION.ADMIN_PANEL];
                if (!mainState || mainState.flowStep !== "edit_user" || !mainState.users.editingUserId) {
                    await (0, renderScreen_1.renderScreen)(bot, chatId, {
                        section: types_1.SECTION.ADMIN_PANEL,
                        text: texts_1.USERS_ERRORS.USER_NOT_CHOOSE_MESSAGE,
                    });
                    return;
                }
                await (0, users_service_1.updateUserRole)(mainState.users.editingUserId, role);
                (0, chat_state_1.setChatState)(chatId, {
                    mode: "idle",
                    sections: {
                        ...state.sections,
                        [types_1.SECTION.ADMIN_PANEL]: {
                            ...mainState,
                            users: {
                                ...mainState.users,
                                editingUserId: undefined,
                            },
                        },
                    },
                });
                await (0, renderScreen_1.renderScreen)(bot, chatId, {
                    section: types_1.SECTION.ADMIN_PANEL,
                    text: texts_1.USERS_TEXTS.ROLE_RENEWED + role,
                    withBackButton: true,
                });
                return;
            }
            case types_1.CALLBACK_TYPE.EDIT_RUB_TO_BYN: {
                await (0, price_service_1.editRates)(bot, chatId, "edit_rub_to_byn");
                return;
            }
            case types_1.CALLBACK_TYPE.EDIT_RUB_TO_USD: {
                await (0, price_service_1.editRates)(bot, chatId, "edit_rub_to_usd");
                return;
            }
            case types_1.CALLBACK_TYPE.EDIT_USD_TO_BYN: {
                await (0, price_service_1.editRates)(bot, chatId, "edit_usd_to_byn");
                return;
            }
            case types_1.CALLBACK_TYPE.RENEW_PRICE: {
                try {
                    await (0, sheets_service_1.loadPricesFormats)();
                    await (0, sheets_service_1.loadBrandsFromConfig)();
                    await (0, sheets_service_1.loadColorsFromConfig)();
                    const updatedProducts = (0, catalog_builder_1.getCatalogProducts)({ role: "admin" });
                    (0, catalog_hanlder_1.generateRetailCsv)();
                    await (0, reports_1.sendHiddenProductsReport)(bot, updatedProducts);
                    await bot.sendMessage(chatId, texts_1.ADMIN_TEXTS.RENEW_PRICE_SUCCESS, {
                        parse_mode: "HTML",
                    });
                    await (0, utils_1.safeAnswerCallback)(bot, query.id);
                }
                catch (error) {
                    await bot.sendMessage(chatId, texts_1.ADMIN_TEXTS.RENEW_PRICE_ERROR, {
                        parse_mode: "HTML",
                    });
                    await (0, utils_1.safeAnswerCallback)(bot, query.id);
                }
                return;
            }
            case types_1.CALLBACK_TYPE.CHECK: {
                const cached_products = (0, products_service_1.getProductCacheValues)();
                const filtered = cached_products.filter(({ rawNames }) => rawNames.length > 1);
                if (!filtered.length) {
                    await bot.sendMessage(chatId, "Проблемных товаров не найдено");
                    return;
                }
                const lines = filtered.map(p => {
                    return [
                        `📦 ${p.name}`,
                        ...p.rawNames.map(r => `• ${r}`),
                    ].join("\n");
                });
                await bot.sendMessage(chatId, lines.join("\n\n").slice(0, 4000));
                return;
            }
            case types_1.CALLBACK_TYPE.BRAND: {
                return (0, utils_1.guardWorkingHours)(bot, chatId, async () => {
                    const state = (0, chat_state_1.getChatState)(chatId);
                    const [brandValue] = params;
                    // если выбрали "Все" → сразу рендерим список товаров
                    if (brandValue === types_1.CATALOG_VALUE.ALL) {
                        await (0, renderProductsList_1.renderProductsList)(bot, chatId);
                        return;
                    }
                    const currentSection = state.section;
                    if (currentSection === types_1.SECTION.CATALOG || currentSection === types_1.SECTION.CART) {
                        (0, chat_state_1.setChatState)(chatId, {
                            sections: {
                                ...state.sections,
                                [currentSection]: {
                                    ...state.sections?.[currentSection],
                                    flowStep: "categories",
                                    selectedBrand: brandValue,
                                    selectedCategory: undefined,
                                },
                            },
                        });
                    }
                    await (0, renderFlow_1.renderFlow)(bot, chatId);
                    return;
                });
            }
            case types_1.CALLBACK_TYPE.CATEGORY: {
                return (0, utils_1.guardWorkingHours)(bot, chatId, async () => {
                    const [categoryValue] = params;
                    const selectedCategory = categoryValue !== types_1.CATALOG_VALUE.ALL ? categoryValue : undefined;
                    const state = (0, chat_state_1.getChatState)(chatId);
                    const currentSection = state.section;
                    if (currentSection === types_1.SECTION.CATALOG || currentSection === types_1.SECTION.CART) {
                        const nextFlowStep = currentSection === types_1.SECTION.CATALOG ? "products" : "models";
                        (0, chat_state_1.setChatState)(chatId, {
                            sections: {
                                ...state.sections,
                                [currentSection]: {
                                    ...state.sections?.[currentSection],
                                    flowStep: nextFlowStep,
                                    selectedCategory,
                                },
                            },
                        });
                        if (currentSection === types_1.SECTION.CATALOG) {
                            await (0, renderProductsList_1.renderProductsList)(bot, chatId);
                        }
                        else {
                            await (0, renderFlow_1.renderFlow)(bot, chatId);
                        }
                        return;
                    }
                    return;
                });
            }
            case types_1.CALLBACK_TYPE.MODEL: {
                return (0, utils_1.guardWorkingHours)(bot, chatId, async () => {
                    const [selectedModel] = params;
                    const state = (0, chat_state_1.getChatState)(chatId);
                    const catalogSection = state.sections?.[types_1.SECTION.CATALOG];
                    const role = (0, users_service_1.getUserRole)(chatId);
                    const filters = {
                        brand: catalogSection?.selectedBrand,
                        category: catalogSection?.selectedCategory,
                        model: selectedModel,
                    };
                    const filteredProducts = (0, catalog_ui_1.getCatalogUIProducts)(filters, role);
                    const hasStorage = filteredProducts.some(p => p.storage);
                    const hasNoStorage = filteredProducts.some(p => !p.storage);
                    if ((0, users_service_1.isAdmin)(chatId)) {
                        if (hasStorage && hasNoStorage) {
                            console.error("❌ Неконсистентные данные: у модели часть товаров с памятью, часть без", {
                                selectedModel,
                                filteredProducts
                            });
                            await (0, renderScreen_1.renderScreen)(bot, chatId, {
                                section: types_1.SECTION.CATALOG,
                                text: texts_1.ADMIN_TEXTS.ERROR_CATALOG + "\n" + selectedModel,
                            });
                        }
                    }
                    (0, chat_state_1.setChatState)(chatId, {
                        sections: {
                            ...state.sections,
                            [types_1.SECTION.CART]: {
                                ...state.sections?.[types_1.SECTION.CART],
                                flowStep: hasStorage ? "storage" : "products_for_cart",
                                selectedModel,
                            },
                        },
                    });
                    await (0, renderFlow_1.renderFlow)(bot, chatId);
                    return;
                });
            }
            case types_1.CALLBACK_TYPE.STORAGE: {
                return (0, utils_1.guardWorkingHours)(bot, chatId, async () => {
                    const [selectedStorage] = params;
                    const state = (0, chat_state_1.getChatState)(chatId);
                    (0, chat_state_1.setChatState)(chatId, {
                        sections: {
                            ...state.sections,
                            [types_1.SECTION.CART]: {
                                ...state.sections?.[types_1.SECTION.CART],
                                flowStep: "products_for_cart",
                                selectedStorage,
                            },
                        },
                    });
                    await (0, renderFlow_1.renderFlow)(bot, chatId);
                    return;
                });
            }
            case types_1.CALLBACK_TYPE.DOWNLOAD_XLSX: {
                return (0, utils_1.guardWorkingHours)(bot, chatId, async () => {
                    const filters = (0, utils_1.downloadCatalogHelpers)(params);
                    const role = (0, users_service_1.getUserRole)(chatId);
                    const productsToExport = (0, catalog_ui_1.getCatalogUIProducts)(filters, role);
                    if (!productsToExport.length) {
                        await (0, renderScreen_1.renderScreen)(bot, chatId, {
                            section: types_1.SECTION.CATALOG,
                            text: texts_1.COMMON_TEXTS.NOT_ITEMS_FOR_EXPORT,
                        });
                        return;
                    }
                    const state = (0, chat_state_1.getChatState)(chatId);
                    (0, chat_state_1.setChatState)(chatId, {
                        section: types_1.SECTION.CATALOG,
                        sections: {
                            ...state.sections,
                            [types_1.SECTION.CATALOG]: {
                                ...state.sections?.[types_1.SECTION.CATALOG],
                                flowStep: state.sections?.[types_1.SECTION.CATALOG]?.flowStep ?? "brands",
                                hasFileBelow: true,
                            }
                        },
                    });
                    await (0, catalog_hanlder_1.sendPriceList)(bot, chatId, productsToExport);
                });
            }
            case types_1.CALLBACK_TYPE.ADD_ITEM_TO_CART: {
                return (0, utils_1.guardWorkingHours)(bot, chatId, async () => {
                    const state = (0, chat_state_1.getChatState)(chatId);
                    (0, chat_state_1.setChatState)(chatId, {
                        sections: {
                            ...state.sections,
                            [types_1.SECTION.CART]: {
                                ...state.sections?.[types_1.SECTION.CART],
                                flowStep: "brands",
                                selectedBrand: undefined,
                                selectedCategory: undefined,
                                selectedModel: undefined,
                                selectedStorage: undefined,
                            },
                        },
                    });
                    await (0, renderFlow_1.renderFlow)(bot, chatId);
                    return;
                });
            }
            case types_1.CALLBACK_TYPE.CHOOSING_PRODUCT: {
                return (0, utils_1.guardWorkingHours)(bot, chatId, async () => {
                    const [selectedProductId] = params;
                    const state = (0, chat_state_1.getChatState)(chatId);
                    (0, chat_state_1.setChatState)(chatId, {
                        mode: "amount_product_for_cart",
                        sections: {
                            ...state.sections,
                            [types_1.SECTION.CART]: {
                                ...state.sections?.[types_1.SECTION.CART],
                                flowStep: "amount",
                                selectedProductId,
                            },
                        },
                    });
                    await (0, renderFlow_1.renderFlow)(bot, chatId);
                    return;
                });
            }
            case types_1.CALLBACK_TYPE.CHOOSING_AMOUNT: {
                return (0, utils_1.guardWorkingHours)(bot, chatId, async () => {
                    const state = (0, chat_state_1.getChatState)(chatId);
                    const [amount] = params;
                    const productAmount = Number(amount);
                    if (Number.isNaN(productAmount)) {
                        await (0, renderScreen_1.renderScreen)(bot, chatId, {
                            section: types_1.SECTION.CART,
                            text: texts_1.CART_TEXTS.AMOUNT_WILL_BE_NUMBER,
                        });
                        return;
                    }
                    const role = (0, users_service_1.getUserRole)(chatId);
                    const chosenProduct = (0, catalog_ui_1.getCatalogProductById)(state.sections?.[types_1.SECTION.CART]?.selectedProductId, role);
                    if (!chosenProduct) {
                        await (0, renderScreen_1.renderScreen)(bot, chatId, {
                            section: types_1.SECTION.CART,
                            text: texts_1.CART_TEXTS.PRODUCT_UNAVAILABLE,
                            withBackButton: true,
                        });
                        return;
                    }
                    const currentOrder = [...(state.sections?.[types_1.SECTION.CART]?.currentOrder || [])];
                    const existingProductIndex = currentOrder.findIndex(item => item.id === chosenProduct.id);
                    if (existingProductIndex !== -1) {
                        currentOrder[existingProductIndex] = {
                            ...currentOrder[existingProductIndex],
                            amount: currentOrder[existingProductIndex].amount + productAmount,
                        };
                    }
                    else {
                        currentOrder.push({
                            ...chosenProduct,
                            amount: productAmount,
                        });
                    }
                    (0, chat_state_1.setChatState)(chatId, {
                        mode: "idle",
                        sections: {
                            ...state.sections,
                            [types_1.SECTION.CART]: {
                                ...state.sections?.[types_1.SECTION.CART],
                                selectedProductId: undefined,
                                flowStep: "products_for_cart",
                                currentOrder,
                            },
                        },
                    });
                    await (0, renderFlow_1.renderFlow)(bot, chatId);
                    return;
                });
            }
            case types_1.CALLBACK_TYPE.CHECK_CART: {
                return (0, utils_1.guardWorkingHours)(bot, chatId, async () => {
                    const state = (0, chat_state_1.getChatState)(chatId);
                    (0, chat_state_1.setChatState)(chatId, {
                        sections: {
                            ...state.sections,
                            [types_1.SECTION.CART]: {
                                ...state.sections?.[types_1.SECTION.CART],
                                flowStep: "main",
                                selectedBrand: undefined,
                                selectedCategory: undefined,
                                selectedModel: undefined,
                                selectedStorage: undefined,
                                selectedAmount: undefined,
                            },
                        },
                    });
                    await (0, renderFlow_1.renderFlow)(bot, chatId);
                    return;
                });
            }
            case types_1.CALLBACK_TYPE.EDITING_ORDER: {
                return (0, utils_1.guardWorkingHours)(bot, chatId, async () => {
                    const state = (0, chat_state_1.getChatState)(chatId);
                    (0, chat_state_1.setChatState)(chatId, {
                        sections: {
                            ...state.sections,
                            [types_1.SECTION.CART]: {
                                ...state.sections?.[types_1.SECTION.CART],
                                flowStep: "edit_cart",
                            },
                        },
                    });
                    await (0, renderFlow_1.renderFlow)(bot, chatId);
                    return;
                });
            }
            case types_1.CALLBACK_TYPE.EDIT_CART_ITEM: {
                return (0, utils_1.guardWorkingHours)(bot, chatId, async () => {
                    const [productId] = params;
                    const state = (0, chat_state_1.getChatState)(chatId);
                    (0, chat_state_1.setChatState)(chatId, {
                        sections: {
                            ...state.sections,
                            [types_1.SECTION.CART]: {
                                ...state.sections?.[types_1.SECTION.CART],
                                flowStep: "edit_product_in_cart",
                                selectedProductIdForCart: productId,
                            },
                        },
                    });
                    await (0, renderFlow_1.renderFlow)(bot, chatId);
                    return;
                });
            }
            case types_1.CALLBACK_TYPE.CLEAR_CART: {
                const state = (0, chat_state_1.getChatState)(chatId);
                (0, chat_state_1.setChatState)(chatId, {
                    sections: {
                        ...state.sections,
                        [types_1.SECTION.CART]: {
                            ...state.sections?.[types_1.SECTION.CART],
                            flowStep: "main",
                            currentOrder: undefined,
                        },
                    },
                });
                await (0, renderFlow_1.renderFlow)(bot, chatId);
                return;
            }
            case types_1.CALLBACK_TYPE.INCREASE_AMOUNT: {
                return (0, utils_1.guardWorkingHours)(bot, chatId, async () => {
                    const state = (0, chat_state_1.getChatState)(chatId);
                    const cartState = state.sections?.[types_1.SECTION.CART];
                    if (!cartState?.currentOrder?.length || !cartState.selectedProductIdForCart) {
                        await (0, renderScreen_1.renderScreen)(bot, chatId, {
                            section: types_1.SECTION.ORDERS,
                            text: texts_1.COMMON_TEXTS.CURRENT_ORDER_ERROR,
                        });
                        return;
                    }
                    const updatedOrder = cartState.currentOrder.map(product => product.id === cartState.selectedProductIdForCart
                        ? { ...product, amount: product.amount + 1 }
                        : product);
                    (0, chat_state_1.setChatState)(chatId, {
                        sections: {
                            ...state.sections,
                            [types_1.SECTION.CART]: {
                                ...cartState,
                                currentOrder: updatedOrder,
                            },
                        },
                    });
                    await (0, renderFlow_1.renderFlow)(bot, chatId);
                    return;
                });
            }
            case types_1.CALLBACK_TYPE.DECREASE_AMOUNT: {
                return (0, utils_1.guardWorkingHours)(bot, chatId, async () => {
                    const state = (0, chat_state_1.getChatState)(chatId);
                    const cartState = state.sections?.[types_1.SECTION.CART];
                    if (!cartState?.currentOrder?.length || !cartState.selectedProductIdForCart) {
                        await (0, renderScreen_1.renderScreen)(bot, chatId, {
                            section: types_1.SECTION.ORDERS,
                            text: texts_1.COMMON_TEXTS.CURRENT_ORDER_ERROR,
                        });
                        return;
                    }
                    const updatedOrder = cartState.currentOrder.map(product => product.id === cartState.selectedProductIdForCart
                        ? { ...product, amount: product.amount - 1 }
                        : product);
                    (0, chat_state_1.setChatState)(chatId, {
                        sections: {
                            ...state.sections,
                            [types_1.SECTION.CART]: {
                                ...cartState,
                                currentOrder: updatedOrder,
                            },
                        },
                    });
                    await (0, renderFlow_1.renderFlow)(bot, chatId);
                    return;
                });
            }
            case types_1.CALLBACK_TYPE.DELETE_POSITION_FROM_CART: {
                const state = (0, chat_state_1.getChatState)(chatId);
                const cartState = state.sections?.[types_1.SECTION.CART];
                if (!cartState?.currentOrder?.length || !cartState.selectedProductIdForCart) {
                    await (0, renderScreen_1.renderScreen)(bot, chatId, {
                        section: types_1.SECTION.ORDERS,
                        text: texts_1.COMMON_TEXTS.CURRENT_ORDER_ERROR,
                    });
                    return;
                }
                const updatedOrder = cartState.currentOrder.filter(({ id }) => id !== cartState.selectedProductIdForCart);
                (0, chat_state_1.setChatState)(chatId, {
                    sections: {
                        ...state.sections,
                        [types_1.SECTION.CART]: {
                            ...cartState,
                            flowStep: "main",
                            currentOrder: updatedOrder,
                            selectedProductIdForCart: undefined,
                        },
                    },
                });
                await (0, renderFlow_1.renderFlow)(bot, chatId);
                return;
            }
            case types_1.CALLBACK_TYPE.SUBMIT_ORDER: {
                return (0, utils_1.guardWorkingHours)(bot, chatId, async () => {
                    const state = (0, chat_state_1.getChatState)(chatId);
                    const cartState = state.sections?.[types_1.SECTION.CART];
                    if (!cartState?.currentOrder?.length) {
                        return;
                    }
                    const order = (0, orders_service_1.createOrder)(query.from, cartState.currentOrder);
                    (0, orders_service_1.addOrder)(order);
                    const message = (0, orders_service_1.buildOrderMessage)(order, chatId);
                    await bot.sendMessage(ADMIN_CHAT_ID, message, {
                        parse_mode: "HTML",
                        reply_markup: {
                            inline_keyboard: [[
                                    {
                                        text: "✉️ Написать клиенту",
                                        url: `tg://user?id=${chatId}`
                                    }
                                ]]
                        }
                    });
                    // очищаем корзину пользователя
                    (0, chat_state_1.setChatState)(chatId, {
                        sections: {
                            ...state.sections,
                            [types_1.SECTION.CART]: {
                                ...cartState,
                                currentOrder: undefined,
                                selectedProductIdForCart: undefined,
                            },
                        },
                    });
                    // подтверждение пользователю
                    await (0, renderScreen_1.renderScreen)(bot, chatId, {
                        section: types_1.SECTION.CART,
                        text: texts_1.COMMON_TEXTS.ORDER_SENT,
                    });
                    return;
                });
            }
            case types_1.CALLBACK_TYPE.ORDERS: {
                const paramValue = params[0];
                let state = (0, chat_state_1.getChatState)(chatId);
                // создаём дефолтное состояние раздела ORDERS при первом заходе
                if (!state.sections?.[types_1.SECTION.ORDERS]) {
                    (0, chat_state_1.setChatState)(chatId, {
                        sections: {
                            ...state.sections,
                            [types_1.SECTION.ORDERS]: {
                                messageId: undefined,
                                flowStep: "main",
                                page: 1,
                                totalPages: 1,
                                selectedUserId: undefined,
                            },
                        },
                    });
                    // берём обновлённый state
                    state = (0, chat_state_1.getChatState)(chatId);
                }
                const ordersState = state.sections[types_1.SECTION.ORDERS];
                // открыть список заказов заново
                if (!paramValue) {
                    await (0, orders_handler_1.ordersHandler)(bot, chatId);
                    return;
                }
                // ввести номер страницы вручную
                if (paramValue === "goto") {
                    (0, chat_state_1.setChatState)(chatId, { mode: "await_orders_page_number" });
                    await (0, renderScreen_1.renderScreen)(bot, chatId, {
                        section: types_1.SECTION.ORDERS,
                        text: texts_1.PAGINATION_TEXTS.ENTER_PAGE_NUMBER,
                    });
                    return;
                }
                // вычисляем новую страницу
                let newPage = ordersState.page;
                if (paramValue === "next")
                    newPage++;
                if (paramValue === "prev")
                    newPage--;
                (0, chat_state_1.setChatState)(chatId, {
                    sections: {
                        ...state.sections,
                        [types_1.SECTION.ORDERS]: {
                            ...ordersState,
                            page: newPage,
                        },
                    },
                });
                await (0, orders_handler_1.ordersHandler)(bot, chatId);
                return;
            }
            case types_1.CALLBACK_TYPE.CHOOSE_ORDER: {
                const state = (0, chat_state_1.getChatState)(chatId);
                const ordersState = state.sections?.[types_1.SECTION.ORDERS];
                (0, chat_state_1.setChatState)(chatId, {
                    sections: {
                        ...state.sections,
                        [types_1.SECTION.ORDERS]: {
                            ...ordersState,
                            flowStep: "order",
                            page: ordersState?.page ?? 1,
                            totalPages: ordersState?.totalPages ?? 1,
                            selectedUserId: ordersState?.selectedUserId,
                        },
                    },
                });
                await (0, orders_handler_1.orderHandler)(bot, chatId, params[0]);
                return;
            }
        }
    });
}
