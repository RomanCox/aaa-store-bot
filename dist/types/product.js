"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NEW_SIM_ONLY_COUNTRIES = exports.OLD_SIM_ONLY_COUNTRIES = exports.NEW_ESIM_ONLY_COUNTRIES = exports.OLD_ESIM_ONLY_COUNTRIES = exports.PRODUCT_XLSX_HEADERS = void 0;
;
exports.PRODUCT_XLSX_HEADERS = {
    id: "SKU",
    category: "Категория",
    name: "Название",
    brand: "Бренд",
    model: "Модель",
    storage: "Хранилище",
    price: "Цена",
    country: "Страна",
    sim: "Тип SIM",
    activated: "Активирован?"
};
exports.OLD_ESIM_ONLY_COUNTRIES = new Set([
    "🇺🇸", "🇵🇷", "🇬🇺", "🇻🇮",
]);
exports.NEW_ESIM_ONLY_COUNTRIES = new Set([
    "🇺🇸", "🇵🇷", "🇨🇦", "🇯🇵", "🇲🇽", "🇶🇦", "🇧🇭", "🇰🇼", "🇴🇲", "🇸🇦", "🇦🇪", "🇬🇺", "🇻🇮",
]);
exports.OLD_SIM_ONLY_COUNTRIES = new Set([
    "🇨🇳", "🇭🇰", "🇲🇴",
]);
exports.NEW_SIM_ONLY_COUNTRIES = new Set([
    "🇨🇳",
]);
