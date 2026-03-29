import TelegramBot from "node-telegram-bot-api";
import { renderFlow } from "./renderFlow";
import { SECTION } from "../types";
import { startUserManagement } from "../services/admin.service";
import { START_TEXTS } from "../texts";
import { adminKeyboard } from "../keyboards";
import { renderScreen } from "./renderScreen";
import { getChatState, setChatState } from "../state/chat.state";
import { ordersHandler } from "../handlers/orders.handler";

export async function renderSection(bot: TelegramBot, chatId: number) {
  const state = getChatState(chatId);

  if (state.section === SECTION.ADMIN_PANEL) {
    const adminState = state.sections?.[SECTION.ADMIN_PANEL];

    if (!adminState || adminState.flowStep === "main") {
      await renderScreen(bot, chatId, {
        section: SECTION.ADMIN_PANEL,
        text: START_TEXTS.ADMIN_PANEL,
        inlineKeyboard: adminKeyboard(),
        parse_mode: "HTML",
      });
      return;
    }

    if (adminState.flowStep === "manage_users") {
      await startUserManagement(bot, chatId);
      return;
    }
  }

  if (state.section === SECTION.CATALOG) {
    await renderFlow(bot, chatId);
    return;
  }

  if (state.section === SECTION.CART) {
    await renderFlow(bot, chatId);
    return;
  }

  if (state.section === SECTION.ORDERS) {
    const ordersState = state.sections?.[SECTION.ORDERS];

    await ordersHandler(
      bot,
      chatId,
      ordersState?.flowStep !== "main"
        ? ordersState?.selectedUserId
        : undefined
    );
    return;
  }
}