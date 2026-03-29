import TelegramBot from "node-telegram-bot-api";
import { ORDER_TEXTS, PAGINATION_TEXTS } from "../texts";
import { getChatState, setChatState } from "../state/chat.state";
import { buildOrderMessage, getOrdersByUserId, getOrdersForAdmin } from "../services/orders.service";
import { CALLBACK_TYPE, Order, SECTION } from "../types";
import { addPaginationButtons, buildCallbackData } from "../utils";
import { isAdmin } from "../services/users.service";
import { renderScreen } from "../render/renderScreen";
import { ORDERS_PER_PAGE } from "../constants";

export async function ordersHandler(
  bot: TelegramBot,
  chatId: number,
  userId?: number
) {
  const state = getChatState(chatId);
  const ordersState = state.sections?.[SECTION.ORDERS];

  let text = ORDER_TEXTS.ENTER_USER_ID;
  const buttons: TelegramBot.InlineKeyboardButton[][] = [];

  // --- ADMIN ---
  if (isAdmin(chatId)) {
    setChatState(chatId, {
      mode: "idle",
      sections: {
        ...state.sections,
        [SECTION.ORDERS]: {
          ...state.sections?.[SECTION.ORDERS],
          selectedUserId: userId,
          page: 1,
          totalPages: state.sections?.[SECTION.ORDERS]?.totalPages ?? 1,
          flowStep: state.sections?.[SECTION.ORDERS]?.flowStep ?? "main",
        },
      },
    });

    if (userId) {
      const orders = getOrdersByUserId(Number(userId));

      if (!orders.length) {
        text = ORDER_TEXTS.NO_ORDERS_FOR_ADMIN;

        setChatState(chatId, {
          mode: "idle",
          sections: {
            ...state.sections,
            [SECTION.ORDERS]: {
              ...state.sections?.[SECTION.ORDERS],
              selectedUserId: userId,
              page: 1,
              totalPages: state.sections?.[SECTION.ORDERS]?.totalPages ?? 1,
              flowStep: "orders",
            },
          },
        });

        await renderScreen(bot, chatId, {
          section: SECTION.ORDERS,
          text,
          parse_mode: "HTML",
          withBackButton: true,
        });

        return;
      }

      text = ORDER_TEXTS.CHOOSE_ORDER;

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
        mode: "choose_userId_for_orders",
        section: SECTION.ORDERS,
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

  function buttonText(order: Order) {
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
    withBackButton: (isAdmin(chatId) && !!userId),
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
        flowStep: "orders",
      },
    },
  });

  await ordersHandler(bot, chatId);
}

export async function orderHandler(bot: TelegramBot, chatId: number, orderId: string) {
  const state = getChatState(chatId);
  const ordersState = state.sections?.[SECTION.ORDERS];
  const userId = isAdmin(chatId) ? Number(ordersState?.selectedUserId) : chatId;

  const order = isAdmin(chatId)
    ? getOrdersForAdmin().find(o => o.id === orderId)
    : getOrdersByUserId(chatId).find(o => o.id === orderId);

  if (!order || !userId) {
    await renderScreen(bot, chatId, {
      section: SECTION.ORDERS,
      text: ORDER_TEXTS.ORDER_NOT_FOUND,
    });
    return;
  }

  const message = buildOrderMessage(order, userId, true, isAdmin(chatId),);

  await renderScreen(bot, chatId, {
    section: SECTION.ORDERS,
    text: message,
    parse_mode: "HTML",
    withBackButton: true,
  });
}