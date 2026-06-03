"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderScreen = renderScreen;
const types_1 = require("../types");
const chat_state_1 = require("../state/chat.state");
const texts_1 = require("../texts");
const utils_1 = require("../utils");
async function renderScreen(bot, chatId, options) {
    const keyboard = options.inlineKeyboard ?? [];
    if (options.withBackButton) {
        keyboard.push([{ text: texts_1.COMMON_TEXTS.BACK_BUTTON, callback_data: types_1.CALLBACK_TYPE.BACK }]);
    }
    let newMessageId;
    const state = (0, chat_state_1.getChatState)(chatId);
    const currentSection = options.section;
    const sectionState = state.sections[currentSection];
    const catalogState = (0, chat_state_1.getSectionState)(state, types_1.SECTION.CATALOG);
    const sectionMessageId = sectionState?.messageId;
    const activeMessageId = state.activeMessageId;
    // 🟢 Если в каталоге есть файл ниже
    if (currentSection === types_1.SECTION.CATALOG && catalogState?.hasFileBelow) {
        // Не удаляем сообщение с последним блоком продуктов
        if (catalogState.messageId && catalogState.messageId !== catalogState.lastProductsMessageId) {
            await (0, utils_1.safeDelete)(bot, chatId, catalogState.messageId);
        }
        // создаем новое сообщение каталога
        const newMessage = await bot.sendMessage(chatId, options.text, {
            parse_mode: options.parse_mode,
            reply_markup: { inline_keyboard: keyboard },
        });
        newMessageId = newMessage.message_id;
        // сбрасываем флаг
        (0, chat_state_1.updateSectionState)(chatId, types_1.SECTION.CATALOG, (prev) => ({
            ...prev,
            messageId: newMessageId,
            hasFileBelow: false,
        }));
    }
    else {
        // 🟢 1. Первый вход в раздел
        if (!sectionMessageId) {
            const newMessage = await bot.sendMessage(chatId, options.text, {
                parse_mode: options.parse_mode,
                reply_markup: { inline_keyboard: keyboard },
            });
            newMessageId = newMessage.message_id;
            // 🔹 первый вход в каталог
            if (currentSection === types_1.SECTION.CATALOG && activeMessageId) {
                try {
                    const isProductsMessage = activeMessageId === catalogState?.lastProductsMessageId;
                    if (!isProductsMessage) {
                        await (0, utils_1.safeDelete)(bot, activeMessageId);
                    }
                }
                catch (e) {
                    console.error("Error deleting message:", e);
                }
            }
        }
        // 🟡 2. Мы уже в этом разделе → редактируем
        else if (sectionMessageId === activeMessageId) {
            // 🔹 действие НЕ в каталоге ИЛИ последнее сообщение не с товарами
            if (currentSection !== types_1.SECTION.CATALOG || !catalogState?.lastProductsMessageId) {
                try {
                    await bot.editMessageText(options.text, {
                        chat_id: chatId,
                        message_id: sectionMessageId,
                        parse_mode: options.parse_mode,
                        reply_markup: { inline_keyboard: keyboard },
                    });
                }
                catch (e) {
                    if (!e.response?.body?.description?.includes("message is not modified")) {
                        throw e;
                    }
                }
                newMessageId = sectionMessageId;
                if (currentSection === types_1.SECTION.CATALOG && catalogState?.flowStep === "products") {
                    (0, chat_state_1.updateSectionState)(chatId, types_1.SECTION.CATALOG, (prev) => ({
                        ...prev,
                        flowStep: prev.flowStep || "brands",
                        lastProductsMessageId: newMessageId,
                    }));
                }
            }
            // 🔹 действие в каталоге И последнее сообщение с товарами
            else {
                const newMessage = await bot.sendMessage(chatId, options.text, {
                    parse_mode: options.parse_mode,
                    reply_markup: { inline_keyboard: keyboard },
                });
                newMessageId = newMessage.message_id;
                (0, chat_state_1.updateSectionState)(chatId, types_1.SECTION.CATALOG, (prev) => ({
                    ...prev,
                    flowStep: prev.flowStep || "brands",
                    lastProductsMessageId: prev.flowStep === "products"
                        ? newMessageId
                        : undefined,
                }));
            }
        }
        // 🔵 3. Возврат в раздел (сообщение старое)
        else {
            const newMessage = await bot.sendMessage(chatId, options.text, {
                parse_mode: options.parse_mode,
                reply_markup: { inline_keyboard: keyboard },
            });
            newMessageId = newMessage.message_id;
            if (currentSection !== types_1.SECTION.CATALOG || !catalogState?.lastProductsMessageId) {
                try {
                    await (0, utils_1.safeDelete)(bot, sectionMessageId);
                }
                catch (e) {
                    console.error("Error deleting message:", e);
                }
            }
            if (currentSection === types_1.SECTION.CATALOG) {
                (0, chat_state_1.setChatState)(chatId, {
                    activeMessageId: newMessageId,
                });
                (0, chat_state_1.updateSectionState)(chatId, types_1.SECTION.CATALOG, (prev) => ({
                    ...prev,
                    messageId: newMessageId,
                    lastProductsMessageId: undefined,
                    flowStep: prev.flowStep || "brands",
                }));
            }
        }
    }
    (0, chat_state_1.setChatState)(chatId, {
        section: options.section,
        activeMessageId: newMessageId,
    });
    (0, chat_state_1.updateSectionState)(chatId, currentSection, (prev) => ({
        ...prev,
        messageId: newMessageId,
    }));
}
