"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendUnknownProductsReport = sendUnknownProductsReport;
exports.sendHiddenProductsReport = sendHiddenProductsReport;
exports.sendUnknownBrandsReport = sendUnknownBrandsReport;
exports.onAiError = onAiError;
exports.onUnresolvedItems = onUnresolvedItems;
exports.onCostReport = onCostReport;
exports.onLowConfidenceItems = onLowConfidenceItems;
const texts_1 = require("../texts");
const constants_1 = require("../constants");
const brands_service_1 = require("../services/brands.service");
const ADMIN_ID = Number(process.env.ADMIN_ID);
async function sendUnknownProductsReport(bot, products) {
    if (!products.length || !ADMIN_ID)
        return;
    const preview = products
        .slice(0, 20)
        .map((p, i) => `${i + 1}. ${p.name}`)
        .join("\n");
    const text = `⚠️ <b>Не удалось определить модель</b>\n\n` +
        `Количество: <b>${products.length}</b>\n\n` +
        preview +
        (products.length > 20 ? `\n\n...и ещё ${products.length - 20}` : "");
    await bot.sendMessage(ADMIN_ID, text, {
        parse_mode: "HTML",
    });
}
async function sendHiddenProductsReport(bot, products) {
    const hiddenProducts = products.filter(p => p.hidden);
    if (!hiddenProducts.length)
        return;
    const header = texts_1.ADMIN_TEXTS.ITEMS_WITHOUT_MARKUP +
        hiddenProducts.length +
        "\n\n";
    const lines = hiddenProducts.map(p => {
        const currency = p.source === "AAA-store"
            ? "RUB"
            : p.source === "Today there tomorrow here"
                ? "USD"
                : "*";
        return `• ${p.category} | ${p.name} — ${p.price} ${currency}`;
    });
    let message = header;
    for (const line of lines) {
        if ((message + line + "\n").length > constants_1.TELEGRAM_MESSAGE_LIMIT) {
            await bot.sendMessage(ADMIN_ID, message);
            message = "";
        }
        message += line + "\n";
    }
    if (message) {
        await bot.sendMessage(ADMIN_ID, message);
    }
    const unresolvedBrandProducts = products.filter(p => !(0, brands_service_1.resolveBrandFromName)(p.name));
    if (unresolvedBrandProducts.length > 0) {
        console.log(unresolvedBrandProducts);
        const unresolvedHeader = texts_1.ADMIN_TEXTS.ITEMS_WITH_UNKNOWN_BRAND +
            unresolvedBrandProducts.length +
            "\n\n";
        const unresolvedLines = unresolvedBrandProducts.map(p => {
            const currency = p.source === "AAA-store"
                ? "RUB"
                : p.source === "Today there tomorrow here"
                    ? "USD"
                    : "*";
            return `• ${p.category} | ${p.name} — ${p.price} ${currency}`;
        });
        let unresolvedMessage = unresolvedHeader;
        for (const line of unresolvedLines) {
            if ((unresolvedMessage + line + "\n").length > constants_1.TELEGRAM_MESSAGE_LIMIT) {
                await bot.sendMessage(ADMIN_ID, unresolvedMessage);
                unresolvedMessage = "";
            }
            unresolvedMessage += line + "\n";
        }
        if (unresolvedMessage) {
            await bot.sendMessage(ADMIN_ID, unresolvedMessage);
        }
    }
}
async function sendUnknownBrandsReport(bot, names) {
    if (!names.length)
        return;
    const unique = [...new Set(names)];
    const header = texts_1.ADMIN_TEXTS.ITEMS_WITH_UNKNOWN_BRAND +
        unique.length +
        "\n\n";
    let message = header;
    for (const name of unique) {
        const line = `• ${name}`;
        if ((message + line + "\n").length > constants_1.TELEGRAM_MESSAGE_LIMIT) {
            await bot.sendMessage(ADMIN_ID, message);
            message = "";
        }
        message += line + "\n";
    }
    if (message) {
        await bot.sendMessage(ADMIN_ID, message);
    }
}
async function onAiError(bot, names) {
    if (!names.length)
        return;
    let message = `${texts_1.ADMIN_TEXTS.AI_ERROR} (${names.length})\n\n`;
    for (const name of names) {
        const line = `• ${name}\n`;
        if ((message + line).length > constants_1.TELEGRAM_MESSAGE_LIMIT) {
            await bot.sendMessage(ADMIN_ID, message);
            message = "";
        }
        message += line;
    }
    if (message) {
        await bot.sendMessage(ADMIN_ID, message);
    }
}
async function onUnresolvedItems(bot, names) {
    if (!names.length)
        return;
    let message = `${texts_1.ADMIN_TEXTS.DONT_RECOGNIZED} (${names.length})\n\n`;
    for (const name of names) {
        const line = `• ${name}\n`;
        if ((message + line).length > constants_1.TELEGRAM_MESSAGE_LIMIT) {
            await bot.sendMessage(ADMIN_ID, message);
            message = "";
        }
        message += line;
    }
    if (message) {
        await bot.sendMessage(ADMIN_ID, message);
    }
}
async function onCostReport(bot, totalCost) {
    await bot.sendMessage(ADMIN_ID, `${texts_1.ADMIN_TEXTS.AI_COST}${totalCost.toFixed(4)}`);
}
async function onLowConfidenceItems(bot, items) {
    if (!items.length)
        return;
    let message = `⚠️ LOW CONFIDENCE (${items.length})\n\n`;
    for (const item of items) {
        const line = `• ${item.name}\n` +
            `  brand: ${item.brand} | cat: ${item.category} | conf: ${item.confidence}\n\n`;
        if ((message + line).length > constants_1.TELEGRAM_MESSAGE_LIMIT) {
            await bot.sendMessage(ADMIN_ID, message);
            message = "";
        }
        message += line;
    }
    if (message) {
        await bot.sendMessage(ADMIN_ID, message);
    }
}
