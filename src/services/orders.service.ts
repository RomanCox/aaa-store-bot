import TelegramBot from "node-telegram-bot-api";
import { IOrder, ProductForCart } from "../types";
import fs from "fs";
import path from "path";

const ORDERS_PATH = path.resolve(__dirname, "../data/orders.json");
export let orders: IOrder[] = [];

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

export function addOrder(order: IOrder) {
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
): IOrder {
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

export function buildOrderMessage(order: IOrder, userId: number): string {
	const total = order.items.reduce(
		(sum, product) => sum + Number(product.price) * product.amount,
		0
	);

	const items = order.items.map((product) =>
		`🔷 ${product.name}
		📦 ${product.amount}шт × ${product.price} = ${Number(product.price) * product.amount}`
	).join("\n\n");

	return `
🆕 <b>Поступил заказ!</b>
🆔 заказа: ${order.id}
👤 <a href="tg://user?id=${userId}">Клиент</a>
📦 Статус: ${order.status}

${items}

💰 <b>Итого:</b> ${total}
`;
}