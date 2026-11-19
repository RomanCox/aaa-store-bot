import type TelegramBot from "node-telegram-bot-api";
import { SECTION } from "../types";
import { getChatState, setChatState } from "../state/chat.state";
import { isAdmin } from "./users.service";
import { adminKeyboard, helperKeyboard } from "../keyboards";
import { ADMIN_TEXTS, HELPER_TEXTS, HELPER_TOPICS } from "../texts";
import { renderScreen } from "../render/renderScreen";

// Не перемешиваем части двух памяток и возврат при быстрых нажатиях.
const pending = new Map<number, Promise<void>>();

function enqueue(chatId: number, action: () => Promise<void>): Promise<void> {
  const job = (pending.get(chatId) ?? Promise.resolve()).catch(() => {}).then(action);
  pending.set(chatId, job);
  return job.finally(() => { if (pending.get(chatId) === job) pending.delete(chatId); });
}

function prepareScreen(chatId: number, flowStep: "helper" | "main", messageId = getChatState(chatId).activeMessageId) {
  const state = getChatState(chatId);
  setChatState(chatId, {
    section: SECTION.ADMIN_PANEL,
    mode: "idle",
    activeMessageId: messageId,
    sections: {
      [SECTION.ADMIN_PANEL]: {
        ...state.sections[SECTION.ADMIN_PANEL],
        messageId, flowStep,
        users: { ...state.sections[SECTION.ADMIN_PANEL]?.users, newUserId: undefined, editingUserId: undefined },
      },
    },
  });
}

export function showAdminHelper(bot: TelegramBot, chatId: number, backToPanel = false): Promise<void> {
  return enqueue(chatId, async () => {
    if (!isAdmin(chatId)) return;
    prepareScreen(chatId, backToPanel ? "main" : "helper");
    await renderScreen(bot, chatId, {
      section: SECTION.ADMIN_PANEL,
      text: backToPanel ? ADMIN_TEXTS.ADMIN_PANEL_TITLE : HELPER_TEXTS.MENU,
      inlineKeyboard: backToPanel ? adminKeyboard() : helperKeyboard(),
      parse_mode: "HTML",
    });
  });
}

export function sendHelperTopic(bot: TelegramBot, chatId: number, topicId?: string): Promise<void> {
  return enqueue(chatId, async () => {
    if (!isAdmin(chatId)) return;
    const topic = HELPER_TOPICS.find(item => item.id === topicId);
    if (!topic) return;
    prepareScreen(chatId, "helper");
    let messageId = getChatState(chatId).activeMessageId;
    try {
      if (messageId) {
        await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId });
      }
      for (const [index, text] of topic.messages.entries()) {
        const last = index === topic.messages.length - 1;
        const message = await bot.sendMessage(chatId, text, {
          parse_mode: "HTML",
          reply_markup: last ? { inline_keyboard: helperKeyboard() } : undefined,
        });
        messageId = message.message_id;
        prepareScreen(chatId, "helper", messageId);
      }
    } catch (error) {
      // Уже отправленные части остаются в чате, навигация доступна для повтора.
      if (messageId) {
        await bot.editMessageReplyMarkup({ inline_keyboard: helperKeyboard() }, { chat_id: chatId, message_id: messageId }).catch(console.error);
      }
      throw error;
    }
  });
}
