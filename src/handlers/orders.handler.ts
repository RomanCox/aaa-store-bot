import TelegramBot from "node-telegram-bot-api";
import { ORDER_TEXTS, PAGINATION_TEXTS } from "../texts";
import { getChatState, setChatState } from "../state/chat.state";
import { getOrdersByUserId } from "../services/orders.service";
import { CALLBACK_TYPE, IOrder, SECTION } from "../types";
import { addPaginationButtons, buildCallbackData } from "../utils";
import { isAdmin } from "../services/users.service";
import { renderScreen } from "../render/renderScreen";

const ORDERS_PER_PAGE = 5;

export async function ordersHandler(
  bot: TelegramBot,
  chatId: number,
  userId?: string
) {
  const state = getChatState(chatId);
  const ordersState = state.sections?.[SECTION.ORDERS];

  let text = ORDER_TEXTS.ENTER_USER_ID;
  const buttons: TelegramBot.InlineKeyboardButton[][] = [];

  // --- ADMIN ---
  if (isAdmin(chatId)) {
    if (userId) {
      const orders = getOrdersByUserId(Number(userId));

      text =
        orders.length > 0
          ? ORDER_TEXTS.CHOOSE_ORDER
          : ORDER_TEXTS.NO_ORDERS;

      for (const order of orders) {
        buttons.push([
          {
            text: buttonText(order),
            callback_data: buildCallbackData(
              CALLBACK_TYPE.CHOOSE_ORDER,
              order.id
            ),
          },
        ]);
      }
    } else {
      setChatState(chatId, {
        section: SECTION.ORDERS,
        sections: {
          ...state.sections,
          [SECTION.ORDERS]: {
            ...ordersState,
            flowStep: "choose_userId_for_orders",
            page: ordersState?.page ?? 1,
            totalPages: ordersState?.totalPages ?? 1,
            selectedUserId: ordersState?.selectedUserId,
          },
        },
      });
    }
  }

  // --- USER ---
  else {
    const orders = getOrdersByUserId(chatId);

    text =
      orders.length > 0
        ? ORDER_TEXTS.CHOOSE_ORDER
        : ORDER_TEXTS.NO_ORDERS;

    for (const order of orders) {
      buttons.push([
        {
          text: buttonText(order),
          callback_data: buildCallbackData(
            CALLBACK_TYPE.CHOOSE_ORDER,
            order.id
          ),
        },
      ]);
    }

    const ordersPage = ordersState?.page ?? 1;
    const ordersTotalPages = Math.max(
      1,
      Math.ceil(orders.length / ORDERS_PER_PAGE)
    );

    if (orders.length > ORDERS_PER_PAGE) {
      buttons.push(
        addPaginationButtons(
          ordersPage,
          ordersTotalPages,
          CALLBACK_TYPE.ORDERS
        )
      );
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
    );
  }

  await renderScreen(bot, chatId, {
    section: SECTION.ORDERS,
    text,
    inlineKeyboard: buttons,
    parse_mode: "HTML",
    withBackButton: isAdmin(chatId),
  });
}

export async function ordersPageInputHandler(
  bot: TelegramBot,
  chatId: number,
  text: string
) {
  const page = Number(text);
  const state = getChatState(chatId);

  // безопасный доступ к orders
  const ordersState = state.sections?.[SECTION.ORDERS];

  const totalPages = ordersState?.totalPages ?? 1;

  if (!Number.isInteger(page) || page < 1) {
    await renderScreen(bot, chatId, {
      section: SECTION.ORDERS,
      text: PAGINATION_TEXTS.ERROR_PAGE,
    });
    return;
  }

  if (page > totalPages) {
    await renderScreen(bot, chatId, {
      section: SECTION.ORDERS,
      text: PAGINATION_TEXTS.PAGE_FROM_TO + totalPages,
    });
    return;
  }

  setChatState(chatId, {
    sections: {
      ...state.sections,
      [SECTION.ORDERS]: {
        ...ordersState,
        page,
        totalPages,
        flowStep: ordersState?.flowStep ?? "main", // обязательно передаём строку
      },
    },
  });

  await ordersHandler(bot, chatId);
}

export async function orderHandler(bot: TelegramBot, chatId: number, orderId: string) {
  const state = getChatState(chatId);
  const ordersState = state.sections?.[SECTION.ORDERS];

  const userIdNum = ordersState?.selectedUserId ? Number(ordersState.selectedUserId) : undefined;
  const ordersList = userIdNum ? getOrdersByUserId(userIdNum) : [];
  const order = ordersList.find(o => o.id === orderId);

  if (!order) {
    await renderScreen(bot, chatId, {
      section: SECTION.ORDERS,
      text: ORDER_TEXTS.ORDER_NOT_FOUND,
    });
    return;
  }

  const formattedDate = new Date(order.createdAt).toLocaleDateString("ru-RU");

  const itemsText = order.items
    .map(
      (item, index) =>
        `${index + 1}. ${item.name}\n` +
        ORDER_TEXTS.AMOUNT + item.amount + "\n" +
        ORDER_TEXTS.PRICE + item.price + "\n" +
        ORDER_TEXTS.SUM + Number(item.price) * item.amount
    )
    .join("\n\n");

  const message =
    ORDER_TEXTS.ORDER_ID + order.id + "\n" +
    ORDER_TEXTS.ORDER_DATE + formattedDate + "\n\n" +
    `${itemsText}\n\n` +
    ORDER_TEXTS.FULL_SUM + order.total;

  await renderScreen(bot, chatId, {
    section: SECTION.ORDERS,
    text: message,
    withBackButton: true,
  });
}