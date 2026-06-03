"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderBrands = renderBrands;
exports.renderCategories = renderCategories;
exports.renderFlow = renderFlow;
const utils_1 = require("../utils");
const chat_state_1 = require("../state/chat.state");
const keyboards_1 = require("../keyboards");
const texts_1 = require("../texts");
const types_1 = require("../types");
const renderProductsList_1 = require("./renderProductsList");
const editCart_keyboard_1 = require("../keyboards/editCart.keyboard");
const price_service_1 = require("../services/price.service");
const editProductInCart_keyboard_1 = require("../keyboards/editProductInCart.keyboard");
const renderScreen_1 = require("./renderScreen");
const catalog_ui_1 = require("../services/catalog/ui/catalog.ui");
const users_service_1 = require("../services/users.service");
async function renderRoot(bot, chatId) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const buildText = (order = []) => {
        if (!order.length) {
            return (texts_1.CART_TEXTS.CART_TITLE +
                "\n\n" +
                texts_1.CART_TEXTS.EMPTY_CART);
        }
        const currency = (0, price_service_1.getCurrency)(chatId);
        let totalSum = 0;
        const lines = order.map((item, index) => {
            const price = Number(item.price);
            const amount = item.amount;
            const country = item.country ?? "";
            const sim = item.sim ?? "";
            const active = item.activated ? "Active" : "";
            const itemTotal = price * amount;
            totalSum += itemTotal;
            return (`${index + 1}. <i>${item.name} ${country} (${sim}) (${active})</i>\n` +
                `  📦 ${amount} шт. × ${price} ${currency} = ${itemTotal} ${currency}`);
        });
        return (texts_1.CART_TEXTS.CART_TITLE +
            "\n\n" +
            lines.join("\n\n") +
            "\n\n" +
            `💰 Итого: ${totalSum} ${currency}`);
    };
    await (0, renderScreen_1.renderScreen)(bot, chatId, {
        section: types_1.SECTION.CART,
        text: buildText(state.sections.cart?.currentOrder),
        inlineKeyboard: (0, keyboards_1.cartRootKeyboard)(state.sections.cart?.currentOrder),
        parse_mode: "HTML",
    });
}
async function renderEditCart(bot, chatId) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const buildText = (order = []) => {
        if (!order.length) {
            return texts_1.CART_TEXTS.EMPTY_CART;
        }
        const lines = order.map((item, index) => {
            const amount = item.amount;
            return `🔷 ${index + 1}. ${item.name} × ${amount}`;
        });
        return (texts_1.CART_TEXTS.EDIT_CART +
            lines.join("\n") +
            "\n\n" +
            texts_1.CART_TEXTS.EDIT_CART_DESCRIPTION);
    };
    await (0, renderScreen_1.renderScreen)(bot, chatId, {
        section: types_1.SECTION.CART,
        text: buildText(state.sections.cart?.currentOrder),
        inlineKeyboard: (0, editCart_keyboard_1.editCartKeyboard)(chatId),
        parse_mode: "HTML",
        withBackButton: true,
    });
    return;
}
async function renderEditProductInCart(bot, chatId) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const product = state.sections.cart?.currentOrder?.find(({ id }) => id === state.sections.cart?.selectedProductIdForCart);
    const buildText = (product) => {
        if (!state.sections.cart?.currentOrder?.length || !product) {
            return texts_1.CART_TEXTS.ERROR_PRODUCT_IN_CART;
        }
        const currency = (0, price_service_1.getCurrency)(chatId);
        return (`🛍 <b>${product.name}</b>\n` +
            texts_1.CART_TEXTS.CART_PRICE + product.price + " " + currency +
            texts_1.CART_TEXTS.PRODUCT_AMOUNT + product.amount +
            texts_1.CART_TEXTS.EDIT_PRODUCT_IN_CART +
            texts_1.CART_TEXTS.INCREASE_AMOUNT +
            (product.amount > 1 ? "\n" + texts_1.CART_TEXTS.DECREASE_AMOUNT : "") +
            texts_1.CART_TEXTS.CHANGE_AMOUNT +
            texts_1.CART_TEXTS.DELETE_PRODUCT_FROM_CART);
    };
    await (0, renderScreen_1.renderScreen)(bot, chatId, {
        section: types_1.SECTION.CART,
        text: buildText(product),
        inlineKeyboard: (0, editProductInCart_keyboard_1.editProductInCartKeyboard)(chatId),
        parse_mode: "HTML",
        withBackButton: true,
    });
}
async function renderBrands(bot, chatId, section) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const sectionState = (0, chat_state_1.getSectionState)(state, section);
    if (!sectionState)
        return;
    const filters = {};
    const role = (0, users_service_1.getUserRole)(chatId);
    const products = (0, catalog_ui_1.getCatalogUIProducts)(filters, role);
    const brands = (0, utils_1.getBrands)(products);
    if (!brands.length) {
        (0, chat_state_1.setChatState)(chatId, {
            mode: "error",
        });
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: section,
            text: texts_1.CATALOG_TEXTS.UNAVAILABLE,
            withBackButton: true,
        });
        return;
    }
    await (0, renderScreen_1.renderScreen)(bot, chatId, {
        section: section,
        text: texts_1.CATALOG_TEXTS.CHOOSE_BRAND,
        inlineKeyboard: (0, keyboards_1.brandsKeyboard)(brands, {
            withAllBtn: section === types_1.SECTION.CATALOG,
            withDownloadBtn: section === types_1.SECTION.CATALOG,
            downloadKey: (0, utils_1.buildDownloadCallback)(filters),
        }),
        withBackButton: section === types_1.SECTION.CART && !!state.sections.cart?.currentOrder?.length
    });
}
async function renderCategories(bot, chatId, section) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const sectionState = (0, chat_state_1.getSectionState)(state, section);
    if (!sectionState)
        return;
    let selectedBrand;
    if (section === types_1.SECTION.CATALOG) {
        selectedBrand = sectionState.selectedBrand;
    }
    else if (section === types_1.SECTION.CART) {
        selectedBrand = sectionState.selectedBrand;
    }
    if (!selectedBrand) {
        (0, chat_state_1.setChatState)(chatId, {
            mode: "error",
        });
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: section,
            text: texts_1.CATALOG_TEXTS.UNAVAILABLE,
            withBackButton: true,
        });
        return;
    }
    const filters = { brand: selectedBrand };
    const role = (0, users_service_1.getUserRole)(chatId);
    const products = (0, catalog_ui_1.getCatalogUIProducts)(filters, role);
    const categories = (0, utils_1.getCategories)(products, selectedBrand);
    const downloadKey = (0, utils_1.buildDownloadCallback)(filters);
    if (!categories.length) {
        (0, chat_state_1.setChatState)(chatId, {
            mode: "error",
        });
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: section,
            text: texts_1.CATALOG_TEXTS.UNAVAILABLE,
            withBackButton: true,
        });
        return;
    }
    const text = section === types_1.SECTION.CATALOG
        ? texts_1.CATALOG_TEXTS.CHOOSE_CATEGORY + selectedBrand + ":"
        : texts_1.CART_TEXTS.YOU_CHOOSE + texts_1.CART_TEXTS.CHOSE_BRAND + selectedBrand;
    await (0, renderScreen_1.renderScreen)(bot, chatId, {
        section: section,
        text,
        inlineKeyboard: (0, keyboards_1.categoriesKeyboard)(categories, {
            withAllBtn: section === types_1.SECTION.CATALOG,
            withDownloadBtn: section === types_1.SECTION.CATALOG,
            downloadKey
        }),
        parse_mode: "HTML",
    });
}
async function renderModels(bot, chatId) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const sectionState = (0, chat_state_1.getSectionState)(state, types_1.SECTION.CART);
    if (!sectionState)
        return;
    const filters = {
        brand: sectionState.selectedBrand,
        category: sectionState.selectedCategory,
    };
    const role = (0, users_service_1.getUserRole)(chatId);
    const products = (0, catalog_ui_1.getCatalogUIProducts)(filters, role);
    const models = (0, utils_1.getModels)(products, sectionState.selectedBrand, sectionState.selectedCategory);
    if (!sectionState.selectedBrand || !sectionState.selectedCategory || !models.length) {
        (0, chat_state_1.setChatState)(chatId, {
            mode: "error",
        });
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: types_1.SECTION.CART,
            text: texts_1.CATALOG_TEXTS.UNAVAILABLE,
            withBackButton: true,
        });
        return;
    }
    const text = texts_1.CART_TEXTS.YOU_CHOOSE +
        texts_1.CART_TEXTS.CHOSE_BRAND +
        `<b>${sectionState.selectedBrand}</b>` +
        texts_1.CART_TEXTS.CHOSE_CATEGORY +
        `<b>${sectionState.selectedCategory}</b>` +
        texts_1.CART_TEXTS.CHOOSE_MODEL;
    await (0, renderScreen_1.renderScreen)(bot, chatId, {
        section: types_1.SECTION.CART,
        text,
        inlineKeyboard: (0, keyboards_1.modelsKeyboard)(models),
        parse_mode: "HTML",
        withBackButton: true,
    });
}
async function renderStorage(bot, chatId) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const sectionState = (0, chat_state_1.getSectionState)(state, types_1.SECTION.CART);
    if (!sectionState)
        return;
    const filters = {
        brand: sectionState.selectedBrand,
        category: sectionState.selectedCategory,
        model: sectionState.selectedModel,
    };
    const role = (0, users_service_1.getUserRole)(chatId);
    const products = (0, catalog_ui_1.getCatalogUIProducts)(filters, role);
    const storageValues = (0, utils_1.getStorageValues)(products, sectionState.selectedBrand, sectionState.selectedCategory, sectionState.selectedModel);
    if (!sectionState.selectedBrand ||
        !sectionState.selectedCategory ||
        !sectionState.selectedModel ||
        !storageValues.length) {
        (0, chat_state_1.setChatState)(chatId, {
            mode: "error",
        });
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: types_1.SECTION.CART,
            text: texts_1.CATALOG_TEXTS.UNAVAILABLE,
            withBackButton: true,
        });
        return;
    }
    const text = texts_1.CART_TEXTS.YOU_CHOOSE +
        texts_1.CART_TEXTS.CHOSE_BRAND +
        `<b>${sectionState.selectedBrand}</b>` +
        texts_1.CART_TEXTS.CHOSE_CATEGORY +
        `<b>${sectionState.selectedCategory}</b>` +
        texts_1.CART_TEXTS.CHOSE_MODEL +
        `<b>${sectionState.selectedModel}</b>` +
        texts_1.CART_TEXTS.CHOOSE_STORAGE;
    await (0, renderScreen_1.renderScreen)(bot, chatId, {
        section: types_1.SECTION.CART,
        text,
        inlineKeyboard: (0, keyboards_1.storageValuesKeyboard)(storageValues),
        parse_mode: "HTML",
        withBackButton: true,
    });
}
async function renderChoosingProduct(bot, chatId) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const sectionState = (0, chat_state_1.getSectionState)(state, types_1.SECTION.CART);
    if (!sectionState)
        return;
    const filters = {
        brand: sectionState.selectedBrand,
        category: sectionState.selectedCategory,
        model: sectionState.selectedModel,
        storage: sectionState.selectedStorage,
    };
    const userRole = (0, users_service_1.getUserRole)(chatId);
    const products = (0, catalog_ui_1.getCatalogUIProducts)(filters, userRole);
    const notActivated = products.filter(p => !p.activated);
    const activated = products.filter(p => p.activated);
    const sortedProducts = [...notActivated, ...activated];
    if (!sectionState.selectedBrand ||
        !sectionState.selectedCategory ||
        !sectionState.selectedModel ||
        !products.length) {
        (0, chat_state_1.setChatState)(chatId, {
            mode: "error",
        });
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: types_1.SECTION.CART,
            text: texts_1.CATALOG_TEXTS.UNAVAILABLE,
            withBackButton: true,
        });
        return;
    }
    const buildText = (products, userRole) => {
        const lines = sortedProducts.map((item, index) => {
            const price = Number(item.price);
            const currency = userRole === "retail" ? "р." : "";
            const country = item.country ?? "";
            const sim = item.sim ?? "";
            const active = item.activated ? "Active" : "";
            let line = `${index + 1}. ${item.name} - ${price}${currency}`;
            if (country) {
                line += ` ${sim}`;
            }
            if (sim) {
                line += ` 📲 ${sim}`; // или line += ` (${sim})`
            }
            if (active) {
                line += ` ✅ ${active}`;
            }
            return line;
        });
        return (texts_1.CART_TEXTS.YOU_CHOOSE +
            texts_1.CART_TEXTS.CHOSE_BRAND +
            `<b>${sectionState.selectedBrand}</b>` +
            texts_1.CART_TEXTS.CHOSE_CATEGORY +
            `<b>${sectionState.selectedCategory}</b>` +
            texts_1.CART_TEXTS.CHOSE_MODEL +
            `<b>${sectionState.selectedModel}</b>` +
            texts_1.CART_TEXTS.CHOSE_STORAGE +
            `<b>${sectionState.selectedStorage}</b>` +
            texts_1.CART_TEXTS.CHOOSE_PRODUCT +
            lines.join("\n"));
    };
    await (0, renderScreen_1.renderScreen)(bot, chatId, {
        section: types_1.SECTION.CART,
        text: buildText(sortedProducts, userRole),
        inlineKeyboard: (0, keyboards_1.choosingProductKeyboard)(chatId, sortedProducts),
        parse_mode: "HTML",
    });
}
async function renderAmount(bot, chatId) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const sectionState = (0, chat_state_1.getSectionState)(state, types_1.SECTION.CART);
    if (!sectionState)
        return;
    const userRole = (0, users_service_1.getUserRole)(chatId);
    const product = (0, catalog_ui_1.getCatalogProductById)(sectionState.selectedProductId, userRole);
    if (!sectionState.selectedBrand || !product) {
        await (0, renderScreen_1.renderScreen)(bot, chatId, { section: types_1.SECTION.CART, text: texts_1.CART_TEXTS.PRODUCT_UNAVAILABLE });
        return;
    }
    const currency = userRole === "retail" ? "р." : "";
    let header = product.name;
    if (product.country)
        header += ` ${product.country}`;
    if (product.sim)
        header += ` (${product.sim})`;
    if (product.activated)
        header += ' (Active)';
    const text = `${header}\n${texts_1.CART_TEXTS.CART_PRICE}${product.price}${currency}\n${texts_1.CART_TEXTS.CHOOSE_AMOUNT}`;
    await (0, renderScreen_1.renderScreen)(bot, chatId, {
        section: types_1.SECTION.CART,
        text,
        inlineKeyboard: (0, keyboards_1.choosingAmountKeyboard)(),
        parse_mode: "HTML",
        withBackButton: true,
    });
}
async function renderFlow(bot, chatId) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const cartState = (0, chat_state_1.getSectionState)(state, types_1.SECTION.CART);
    if (!cartState)
        return;
    const filters = {
        brand: cartState.selectedBrand,
        category: cartState.selectedCategory,
    };
    const role = (0, users_service_1.getUserRole)(chatId);
    const products = (0, catalog_ui_1.getCatalogUIProducts)(filters, role);
    if (!products || products.length === 0) {
        (0, chat_state_1.setChatState)(chatId, {
            mode: "error",
        });
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: types_1.SECTION.CART,
            text: texts_1.CATALOG_TEXTS.UNAVAILABLE,
            withBackButton: true,
        });
        return;
    }
    switch (state.section) {
        case types_1.SECTION.CATALOG: {
            const flowStep = state.sections.catalog?.flowStep ?? "main";
            switch (flowStep) {
                case "brands":
                    return renderBrands(bot, chatId, types_1.SECTION.CATALOG);
                case "categories":
                    return renderCategories(bot, chatId, types_1.SECTION.CATALOG);
                case "products":
                    return (0, renderProductsList_1.renderProductsList)(bot, chatId);
                default:
                    return renderBrands(bot, chatId, types_1.SECTION.CATALOG);
            }
        }
        case types_1.SECTION.CART: {
            const flowStep = state.sections.cart?.flowStep ?? "main";
            switch (flowStep) {
                case "main":
                    return renderRoot(bot, chatId);
                case "brands":
                    return renderBrands(bot, chatId, types_1.SECTION.CART);
                case "categories":
                    return renderCategories(bot, chatId, types_1.SECTION.CART);
                case "models":
                    return renderModels(bot, chatId);
                case "storage":
                    return renderStorage(bot, chatId);
                case "products_for_cart":
                    return renderChoosingProduct(bot, chatId);
                case "amount":
                    return renderAmount(bot, chatId);
                case "edit_cart":
                    return renderEditCart(bot, chatId);
                case "edit_product_in_cart":
                    return renderEditProductInCart(bot, chatId);
                default:
                    return renderRoot(bot, chatId);
            }
        }
        default:
            return renderRoot(bot, chatId);
    }
}
