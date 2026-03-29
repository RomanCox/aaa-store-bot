import TelegramBot from "node-telegram-bot-api";
import { Order, ProductForCart } from "../types";
import fs from "fs";
import { ORDERS_PATH } from "../constants";
import { ORDER_TEXTS } from "../texts";
import { getUser } from "./users.service";

export let orders: Order[] = [];

export function loadOrdersFromFile() {
  if (!fs.existsSync(ORDERS_PATH)) {
    orders = [];
    return;
  }

  orders = JSON.parse(fs.readFileSync(ORDERS_PATH, "utf-8"));
}

function persist() {
  fs.writeFileSync(
    ORDERS_PATH,
    JSON.stringify(orders, null, 2),
    "utf-8"
  );
}

export function getOrdersForAdmin() {
  return [...orders];
}

export function getOrdersByUserId(userId: number) {
  return orders.filter(order => order.userId === userId);
}

export function addOrder(order: Order) {
  orders.push(order);
  persist();
}

export function generateOrderId(): string {
  const base = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");

  return base + random;
}

export function createOrder(
  user: TelegramBot.User,
  currentOrder: ProductForCart[]
): Order {
  const total = currentOrder.reduce(
    (sum, product) => sum + Number(product.price) * product.amount,
    0
  );

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

export function buildOrderMessage(
  order: Order,
  userId: number,
  isForOrdersList?: boolean,
  isAdmin?: boolean
): string {
  const firstLine = isForOrdersList ? "" : "🆕 <b>Поступил заказ!</b>\n"
  const formattedDate = new Date(order.createdAt).toLocaleDateString("ru-RU");
  const dateString = ORDER_TEXTS.ORDER_DATE + formattedDate + "\n"

  const user = getUser(userId);
  const roleMap: Record<string, string> = {
    retail: "Розница",
    wholesale: "Опт",
  };

  const userLine = (!isForOrdersList || isAdmin)
    ? user?.username
      ? `👤 Клиент: @${user.username}\n`
      : `👤 Клиент: <code>${userId}</code>\n`
    : "";

  const userRole = (!isForOrdersList && user?.role) ? `${roleMap[user.role]}\n` : "";

  const items = order.items.map((product) =>
    `🔹 ${product.name}
		📦 ${product.amount}шт × ${product.price} = ${Number(product.price) * product.amount}`
  ).join("\n\n");

  const total = order.items.reduce(
		(sum, product) => sum + Number(product.price) * product.amount,
		0
	);

	return `
${firstLine}🆔 заказа: ${order.id}
${dateString}
${userLine}
${userRole}
${items}

💰 <b>Итого:</b> ${total}
`;
}