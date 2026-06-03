"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderFlow = renderFlow;
const products_service_1 = require("../services/products.service");
const utils_1 = require("../utils");
const chat_state_1 = require("../state/chat.state");
const keyboards_1 = require("../keyboards");
const texts_1 = require("../texts");
const keyboards_2 = require("../keyboards");
const types_1 = require("../types");
const users_service_1 = require("../services/users.service");
const renderProductsList_1 = require("../render/renderProductsList");
const keyboards_3 = require("../keyboards");
const keyboards_4 = require("../keyboards");
const keyboards_5 = require("../keyboards");
const keyboards_6 = require("../keyboards");
const keyboards_7 = require("../keyboards");
const editCart_keyboard_1 = require("../keyboards/editCart.keyboard");
const price_service_1 = require("../services/price.service");
const editProductInCart_keyboard_1 = require("../keyboards/editProductInCart.keyboard");
const renderScreen_1 = require("../render/renderScreen");
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
            const itemTotal = price * amount;
            totalSum += itemTotal;
            return (`${index + 1}. <i>${item.name}</i>\n` +
                `  📦 ${amount} шт. × ${price} ${currency} ${country} = ${itemTotal} ${currency}`);
        });
        return (texts_1.CART_TEXTS.CART_TITLE +
            "\n\n" +
            lines.join("\n\n") +
            "\n\n" +
            `💰 Итого: ${totalSum} ${currency}`);
    };
    await (0, renderScreen_1.renderScreen)(bot, chatId, buildText(state.currentOrder), (0, keyboards_3.cartRootKeyboard)(state.currentOrder, {
        showBack: (0, users_service_1.isAdmin)(chatId),
    }), "HTML");
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
    await (0, renderScreen_1.renderScreen)(bot, chatId, buildText(state.currentOrder), (0, editCart_keyboard_1.editCartKeyboard)(chatId), "HTML");
    return;
}
async function renderEditProductInCart(bot, chatId) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const product = state.currentOrder?.find(({ id }) => id === state.selectedProductIdForCart);
    const buildText = (product) => {
        if (!state.currentOrder?.length || !product) {
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
    await (0, renderScreen_1.renderScreen)(bot, chatId, buildText(product), (0, editProductInCart_keyboard_1.editProductInCartKeyboard)(chatId), "HTML");
}
async function renderBrands(bot, chatId) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const products = (0, products_service_1.getProducts)(chatId);
    const brands = (0, utils_1.getBrands)(products);
    if (!brands.length) {
        await (0, renderScreen_1.renderScreen)(bot, chatId, texts_1.CATALOG_TEXTS.UNAVAILABLE);
        return;
    }
    await (0, renderScreen_1.renderScreen)(bot, chatId, texts_1.CATALOG_TEXTS.CHOOSE_BRAND, (0, keyboards_1.brandsKeyboard)(brands, {
        withAllBtn: state.section === types_1.SECTION.CATALOG,
        withDownloadBtn: state.section === types_1.SECTION.CATALOG,
        showBack: (0, users_service_1.isAdmin)(chatId)
    }));
}
async function renderCategories(bot, chatId) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const products = (0, products_service_1.getProducts)(chatId, { brand: state.selectedBrand });
    const categories = (0, utils_1.getCategories)(products, state.selectedBrand);
    if (!state.selectedBrand || !categories.length) {
        await (0, renderScreen_1.renderScreen)(bot, chatId, texts_1.CATALOG_TEXTS.UNAVAILABLE);
        return;
    }
    const text = state.section === types_1.SECTION.CATALOG
        ? texts_1.CATALOG_TEXTS.CHOOSE_CATEGORY + state.selectedBrand + ":"
        : texts_1.CART_TEXTS.YOU_CHOOSE + texts_1.CART_TEXTS.CHOSE_BRAND + state.selectedBrand;
    await (0, renderScreen_1.renderScreen)(bot, chatId, text, (0, keyboards_2.categoriesKeyboard)(categories, { withAllBtn: state.section === types_1.SECTION.CATALOG, withDownloadBtn: state.section === types_1.SECTION.CATALOG }), "HTML");
}
async function renderModels(bot, chatId) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const products = (0, products_service_1.getProducts)(chatId, {
        brand: state.selectedBrand,
        category: state.selectedCategory,
    });
    const models = (0, utils_1.getModels)(products, state.selectedBrand, state.selectedCategory);
    if (!state.selectedBrand || !state.selectedCategory || !models.length) {
        await (0, renderScreen_1.renderScreen)(bot, chatId, texts_1.CATALOG_TEXTS.UNAVAILABLE);
        return;
    }
    const text = texts_1.CART_TEXTS.YOU_CHOOSE +
        texts_1.CART_TEXTS.CHOSE_BRAND +
        `<b>${state.selectedBrand}</b>` +
        texts_1.CART_TEXTS.CHOSE_CATEGORY +
        `<b>${state.selectedCategory}</b>` +
        texts_1.CART_TEXTS.CHOOSE_MODEL;
    await (0, renderScreen_1.renderScreen)(bot, chatId, text, (0, keyboards_4.modelsKeyboard)(models), "HTML");
}
async function renderStorage(bot, chatId) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const products = (0, products_service_1.getProducts)(chatId, {
        brand: state.selectedBrand,
        category: state.selectedCategory,
        model: state.selectedModel,
    });
    const storageValues = (0, utils_1.getStorageValues)(products, state.selectedBrand, state.selectedCategory, state.selectedModel);
    if (!state.selectedBrand ||
        !state.selectedCategory ||
        !state.selectedModel ||
        !storageValues.length) {
        await (0, renderScreen_1.renderScreen)(bot, chatId, texts_1.CATALOG_TEXTS.UNAVAILABLE);
        return;
    }
    const text = texts_1.CART_TEXTS.YOU_CHOOSE +
        texts_1.CART_TEXTS.CHOSE_BRAND +
        `<b>${state.selectedBrand}</b>` +
        texts_1.CART_TEXTS.CHOSE_CATEGORY +
        `<b>${state.selectedCategory}</b>` +
        texts_1.CART_TEXTS.CHOSE_MODEL +
        `<b>${state.selectedModel}</b>` +
        texts_1.CART_TEXTS.CHOOSE_STORAGE;
    await (0, renderScreen_1.renderScreen)(bot, chatId, text, (0, keyboards_5.storageValuesKeyboard)(storageValues), "HTML");
}
async function renderChoosingProduct(bot, chatId) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const products = (0, products_service_1.getProducts)(chatId, {
        brand: state.selectedBrand,
        category: state.selectedCategory,
        model: state.selectedModel,
        storage: state.selectedStorage
    });
    if (!state.selectedBrand ||
        !state.selectedCategory ||
        !state.selectedModel ||
        !state.selectedStorage ||
        !products.length) {
        await (0, renderScreen_1.renderScreen)(bot, chatId, texts_1.CATALOG_TEXTS.UNAVAILABLE);
        return;
    }
    const buildText = (products) => {
        const lines = products.map((item, index) => {
            const price = Number(item.price);
            const country = item.country ?? "";
            return (`${index + 1}. ${item.name} - ${price} ${country}`);
        });
        return (texts_1.CART_TEXTS.YOU_CHOOSE +
            texts_1.CART_TEXTS.CHOSE_BRAND +
            `<b>${state.selectedBrand}</b>` +
            texts_1.CART_TEXTS.CHOSE_CATEGORY +
            `<b>${state.selectedCategory}</b>` +
            texts_1.CART_TEXTS.CHOSE_MODEL +
            `<b>${state.selectedModel}</b>` +
            texts_1.CART_TEXTS.CHOSE_STORAGE +
            `<b>${state.selectedStorage}</b>` +
            texts_1.CART_TEXTS.CHOOSE_PRODUCT +
            lines.join("\n"));
    };
    await (0, renderScreen_1.renderScreen)(bot, chatId, buildText(products), (0, keyboards_6.choosingProductKeyboard)(chatId, products), "HTML");
}
async function renderAmount(bot, chatId) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const product = (0, products_service_1.getProductById)(chatId, state.selectedProductId);
    if (!state.selectedBrand || !product) {
        await (0, renderScreen_1.renderScreen)(bot, chatId, texts_1.CART_TEXTS.PRODUCT_UNAVAILABLE);
        return;
    }
    const text = `${product.name}\n` +
        texts_1.CART_TEXTS.CART_PRICE +
        product.price +
        product.country + "\n" +
        texts_1.CART_TEXTS.CHOOSE_AMOUNT;
    await (0, renderScreen_1.renderScreen)(bot, chatId, text, (0, keyboards_7.choosingAmountKeyboard)(), "HTML");
}
async function renderFlow(bot, chatId) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const products = (0, products_service_1.getProducts)(chatId, {
        brand: state.selectedBrand,
        category: state.selectedCategory,
    });
    if (!products || products.length === 0) {
        await (0, renderScreen_1.renderScreen)(bot, chatId, texts_1.CATALOG_TEXTS.UNAVAILABLE);
        return;
    }
    switch (state.flowStep) {
        case "main": {
            await renderRoot(bot, chatId);
            break;
        }
        case "brands":
            await renderBrands(bot, chatId);
            break;
        case "categories":
            await renderCategories(bot, chatId);
            break;
        case "products":
            await (0, renderProductsList_1.renderProductsList)(bot, chatId);
            break;
        case "models":
            await renderModels(bot, chatId);
            break;
        case "storage":
            await renderStorage(bot, chatId);
            break;
        case "products_for_cart":
            await renderChoosingProduct(bot, chatId);
            break;
        case "amount":
            await renderAmount(bot, chatId);
            break;
        case "edit_cart":
            await renderEditCart(bot, chatId);
            break;
        case "edit_product_in_cart":
            await renderEditProductInCart(bot, chatId);
            break;
        default:
            break;
    }
}
