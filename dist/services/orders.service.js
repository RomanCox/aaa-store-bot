"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orders = void 0;
exports.loadOrdersFromFile = loadOrdersFromFile;
exports.getOrdersForAdmin = getOrdersForAdmin;
exports.getOrdersByUserId = getOrdersByUserId;
exports.addOrder = addOrder;
exports.generateOrderId = generateOrderId;
exports.createOrder = createOrder;
exports.buildOrderMessage = buildOrderMessage;
const fs_1 = __importDefault(require("fs"));
const constants_1 = require("../constants");
const texts_1 = require("../texts");
const users_service_1 = require("./users.service");
exports.orders = [];
function loadOrdersFromFile() {
    if (!fs_1.default.existsSync(constants_1.ORDERS_PATH)) {
        exports.orders = [];
        return;
    }
    exports.orders = JSON.parse(fs_1.default.readFileSync(constants_1.ORDERS_PATH, "utf-8"));
}
function persist() {
    fs_1.default.writeFileSync(constants_1.ORDERS_PATH, JSON.stringify(exports.orders, null, 2), "utf-8");
}
function getOrdersForAdmin() {
    return [...exports.orders];
}
function getOrdersByUserId(userId) {
    return exports.orders.filter(order => order.userId === userId);
}
function addOrder(order) {
    exports.orders.push(order);
    persist();
}
function generateOrderId() {
    const base = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
    return base + random;
}
function createOrder(user, currentOrder) {
    const total = currentOrder.reduce((sum, product) => sum + Number(product.price) * product.amount, 0);
    const fullName = [user.first_name, user.last_name]
        .filter(Boolean)
        .join(" ");
    return {
        id: generateOrderId(),
        userId: user.id,
        username: user.username,
        fullName: fullName || undefined,
        items: [...currentOrder], // копия массива
        total,
        status: "new",
        createdAt: new Date().toISOString(),
    };
}
function buildOrderMessage(order, userId, isForOrdersList, isAdmin) {
    const firstLine = isForOrdersList ? "" : "🆕 <b>Поступил заказ!</b>\n";
    const formattedDate = new Date(order.createdAt).toLocaleDateString("ru-RU");
    const dateString = texts_1.ORDER_TEXTS.ORDER_DATE + formattedDate;
    const user = (0, users_service_1.getUser)(userId);
    const roleMap = {
        retail: "Розница",
        wholesale: "Опт",
    };
    const userLine = (!isForOrdersList || isAdmin)
        ? user?.username
            ? `\n👤 Клиент: @${user.username}\n`
            : `\n👤 Клиент: <code>${userId}</code>\n`
        : "";
    const userRole = (!isForOrdersList && user?.role) ? `${roleMap[user.role]}\n` : "";
    // const userBlock = `${userLine}`
    const items = order.items.map((product) => `🔹 ${product.name} ${product.country}
		📦 ${product.amount}шт × ${product.price} = ${Number(product.price) * product.amount}`).join("\n\n");
    const total = order.items.reduce((sum, product) => sum + Number(product.price) * product.amount, 0);
    return `
${firstLine}🆔 заказа: ${order.id}
${dateString}
${userLine}${userRole}
${items}

💰 <b>Итого:</b> ${total}
`;
}
