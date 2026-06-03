"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadRates = loadRates;
exports.getRates = getRates;
exports.saveRates = saveRates;
exports.editRates = editRates;
exports.loadPriceFormation = loadPriceFormation;
exports.getPriceFormation = getPriceFormation;
exports.savePriceFormation = savePriceFormation;
exports.getCurrency = getCurrency;
const fs_1 = __importDefault(require("fs"));
const types_1 = require("../types");
const chat_state_1 = require("../state/chat.state");
const texts_1 = require("../texts");
const users_service_1 = require("./users.service");
const renderScreen_1 = require("../render/renderScreen");
const constants_1 = require("../constants");
const DEFAULT_RATES = {
    rub_to_byn: 0,
    rub_to_usd: 0,
    usd_to_byn: 0,
};
const DEFAULT_PRICE_FORMATION = [];
let rates = DEFAULT_RATES;
let priceFormation = DEFAULT_PRICE_FORMATION;
function loadRates() {
    if (!fs_1.default.existsSync(constants_1.RATES_PATH)) {
        rates = DEFAULT_RATES;
        return;
    }
    try {
        const raw = fs_1.default.readFileSync(constants_1.RATES_PATH, "utf8");
        const parsed = JSON.parse(raw);
        rates = {
            rub_to_byn: Number(parsed?.rub_to_byn) || 0,
            rub_to_usd: Number(parsed?.rub_to_usd) || 0,
            usd_to_byn: Number(parsed?.usd_to_byn) || 0,
        };
    }
    catch (e) {
        console.error("❌ Ошибка чтения rates.json", e);
        rates = DEFAULT_RATES;
    }
}
function getRates() {
    return rates;
}
async function saveRates(update) {
    const newRates = getRates();
    switch (update.type) {
        case "edit_rub_to_byn":
            rates.rub_to_byn = update.value;
            break;
        case "edit_rub_to_usd":
            rates.rub_to_usd = update.value;
            break;
        case "edit_usd_to_byn":
            rates.usd_to_byn = update.value;
            break;
    }
    fs_1.default.writeFileSync(constants_1.RATES_PATH, JSON.stringify(newRates, null, 2), "utf-8");
    rates = newRates;
}
async function editRates(bot, chatId, ratesEditType) {
    (0, chat_state_1.setChatState)(chatId, {
        mode: ratesEditType,
    });
    const textGenerate = (ratesEditType) => {
        if (ratesEditType === "edit_rub_to_byn")
            return texts_1.PRICE_TEXTS.ENTER_RUB_TO_BYN;
        if (ratesEditType === "edit_usd_to_byn")
            return texts_1.PRICE_TEXTS.ENTER_USD_TO_BYN;
        return texts_1.PRICE_TEXTS.ENTER_RUB_TO_USD;
    };
    await (0, renderScreen_1.renderScreen)(bot, chatId, {
        section: types_1.SECTION.ADMIN_PANEL,
        text: textGenerate(ratesEditType),
        withBackButton: true,
    });
    return;
}
function loadPriceFormation() {
    if (!fs_1.default.existsSync(constants_1.PRICE_FORMATION_PATH)) {
        priceFormation = DEFAULT_PRICE_FORMATION;
        return;
    }
    try {
        const raw = fs_1.default.readFileSync(constants_1.PRICE_FORMATION_PATH, "utf8");
        priceFormation = JSON.parse(raw);
    }
    catch (e) {
        console.error("❌ Ошибка чтения price_formation.json", e);
        priceFormation = DEFAULT_PRICE_FORMATION;
    }
}
function getPriceFormation() {
    return priceFormation;
}
async function savePriceFormation(update) {
    fs_1.default.writeFileSync(constants_1.PRICE_FORMATION_PATH, JSON.stringify(update, null, 2), "utf-8");
    priceFormation = update;
}
function getCurrency(userId) {
    const userRole = (0, users_service_1.getUserRole)(userId);
    return userRole === "retail" ? "BYN" : userRole === "wholesale" ? "USD" : "₽";
}
