"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editPriceInputHandler = editPriceInputHandler;
const types_1 = require("../types");
const price_service_1 = require("../services/price.service");
const chat_state_1 = require("../state/chat.state");
const texts_1 = require("../texts");
const renderScreen_1 = require("../render/renderScreen");
async function editPriceInputHandler(bot, chatId, value) {
    const numberValue = Number(value.trim());
    if (Number.isNaN(numberValue)) {
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: types_1.SECTION.ADMIN_PANEL,
            text: texts_1.PRICE_ERRORS.PRICE_FORMAT_ERROR,
            withBackButton: true,
        });
        return;
    }
    const state = (0, chat_state_1.getChatState)(chatId);
    const allowedModes = [
        "edit_rub_to_byn",
        "edit_rub_to_usd",
        "edit_usd_to_byn",
    ];
    if (!allowedModes.includes(state.mode)) {
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: types_1.SECTION.ADMIN_PANEL,
            text: texts_1.PRICE_ERRORS.ERROR_STATE + state.mode,
            withBackButton: true,
        });
        return;
    }
    try {
        await (0, price_service_1.saveRates)({ type: state.mode, value: numberValue });
        (0, chat_state_1.setChatState)(chatId, { mode: "idle" });
        // ✅ Типизируем только для конкретных allowedModes
        const successTexts = {
            edit_rub_to_byn: texts_1.PRICE_TEXTS.ENTER_RUB_TO_BYN_EDIT_SUCCESSFUL,
            edit_rub_to_usd: texts_1.PRICE_TEXTS.ENTER_RUB_TO_USD_EDIT_SUCCESSFUL,
            edit_usd_to_byn: texts_1.PRICE_TEXTS.ENTER_USD_TO_BYN_EDIT_SUCCESSFUL,
        };
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: types_1.SECTION.ADMIN_PANEL,
            text: successTexts[state.mode] + numberValue,
            withBackButton: true,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            await (0, renderScreen_1.renderScreen)(bot, chatId, {
                section: types_1.SECTION.ADMIN_PANEL,
                text: texts_1.PRICE_ERRORS.ERROR_PRICE_FORMATION_EDIT,
                withBackButton: true,
            });
        }
    }
}
