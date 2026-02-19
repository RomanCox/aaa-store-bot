import TelegramBot from "node-telegram-bot-api";
import { COMMON_TEXTS, ORDER_TEXTS, PAGINATION_TEXTS } from "../texts";
import { getChatState, setChatState } from "../state/chat.state";
import { getOrdersByUserId, orders } from "../services/orders.service";
import { CALLBACK_TYPE, IOrder } from "../types";
import { addPaginationButtons, buildCallbackData } from "../utils";
import { showUsersList } from "./users/users.handler";
import { isAdmin } from "../services/users.service";
import { renderScreen } from "../render/renderScreen";

const ORDERS_PER_PAGE = 5;

export async function ordersHandler(bot: TelegramBot, chatId: number, userId?: string) {
  const state = getChatState(chatId);

  let text = ORDER_TEXTS.ENTER_USER_ID;
  const buttons: TelegramBot.InlineKeyboardButton[][] = [];

  if (isAdmin(chatId)) {
    if (userId) {
      const orders = getOrdersByUserId(Number(userId))
      for (const order of orders) {
        buttons.push([
          { text: buttonText(order), callback_data: buildCallbackData(CALLBACK_TYPE.CHOOSE_ORDER, order.id ) },
        ])
      }
    } else {
      setChatState(chatId, {
        mode: "choose_userId_for_orders",
      });
      buttons.push([
        { text: COMMON_TEXTS.BACK_BUTTON, callback_data: CALLBACK_TYPE.BACK },
      ])
    }
  } else {
    text = orders.length > 0 ? ORDER_TEXTS.CHOOSE_ORDER : ORDER_TEXTS.NO_ORDERS;

    for (const order of orders) {
      buttons.push([
        { text: buttonText(order), callback_data: buildCallbackData(CALLBACK_TYPE.CHOOSE_ORDER, order.id ) },
      ])
    }

    const ordersPage = state.ordersPage ?? 1;
    const ordersTotalPages = Math.max(
      1,
      Math.ceil(orders.length / ORDERS_PER_PAGE)
    );

    if (orders.length > ORDERS_PER_PAGE) {
      buttons.push(addPaginationButtons(ordersPage, ordersTotalPages, CALLBACK_TYPE.ORDERS))
    }
  }

  function buttonText(order: IOrder) {
    const date = new Date(order.createdAt);
    const formattedDate = date.toLocaleDateString("ru-RU");

    return (
      ORDER_TEXTS.ORDER_ID +
      order.id +
      ORDER_TEXTS.ORDER_FROM +
      formattedDate
    )
  }

  await renderScreen(bot, chatId, text, buttons, "HTML");
}

export async function ordersPageInputHandler(
  bot: TelegramBot,
  chatId: number,
  text: string
) {
  const page = Number(text);
  const state = getChatState(chatId);

  if (!Number.isInteger(page) || page < 1) {
    await renderScreen(bot, chatId, PAGINATION_TEXTS.ERROR_PAGE);
    return;
  }

  if (page < 1 || page > (state.ordersTotalPages ?? 0)) {
    await renderScreen(bot, chatId, PAGINATION_TEXTS.PAGE_FROM_TO + state.ordersTotalPages);
    return;
  }

  setChatState(chatId, {
    ordersPage: page,
  });
  await showUsersList(bot, chatId);
}

export async function orderHandler(bot: TelegramBot, chatId: number, orderId: string) {
  const order = orders.find(o => o.id === orderId);

  if (!order) {
    await renderScreen(bot, chatId, ORDER_TEXTS.ORDER_NOT_FOUND);
    return;
  }

  const formattedDate = new Date(order.createdAt)
    .toLocaleDateString("ru-RU");

  const itemsText = order.items
    .map(
      (item, index) =>
        `${index + 1}. ${item.name}\n` +
        ORDER_TEXTS.AMOUNT + item.amount + "\n" +
        ORDER_TEXTS.PRICE + item.price + "\n" +
        ORDER_TEXTS.SUM + (Number(item.price) * item.amount)
    )
    .join("\n\n");

  const message =
    ORDER_TEXTS.ORDER_ID + order.id + "\n" +
    ORDER_TEXTS.ORDER_DATE + formattedDate + "\n\n" +
    `${itemsText}\n\n` +
    ORDER_TEXTS.FULL_SUM + order.total;

  await renderScreen(bot, chatId, message, [[{
    text: COMMON_TEXTS.BACK_BUTTON,
    callback_data: CALLBACK_TYPE.BACK,
  }]]);
}