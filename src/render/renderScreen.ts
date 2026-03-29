import TelegramBot from "node-telegram-bot-api";
import { CALLBACK_TYPE, SECTION } from "../types";
import { getChatState, getSectionState, setChatState, updateSectionState } from "../state/chat.state";
import { COMMON_TEXTS } from "../texts";
import { safeDelete } from "../utils";

interface RenderOptions<K extends SECTION> {
  section: K;
  text: string;
  inlineKeyboard?: TelegramBot.InlineKeyboardButton[][];
  parse_mode?: TelegramBot.ParseMode;
  withBackButton?: boolean;
}

export async function renderScreen<K extends SECTION>(
  bot: TelegramBot,
  chatId: number,
  options: RenderOptions<K>,
) {
  const keyboard = options.inlineKeyboard ?? [];
  if (options.withBackButton) {
    keyboard.push([{ text: COMMON_TEXTS.BACK_BUTTON, callback_data: CALLBACK_TYPE.BACK }]);
  }

  let newMessageId: number | undefined;

  const state = getChatState(chatId);
  const currentSection = options.section;

  const sectionState = state.sections[currentSection];
  const catalogState = getSectionState(state, SECTION.CATALOG);
  const sectionMessageId = sectionState?.messageId;
  const activeMessageId = state.activeMessageId;

  // 🟢 Если в каталоге есть файл ниже
  if (currentSection === SECTION.CATALOG && catalogState?.hasFileBelow) {
    // Не удаляем сообщение с последним блоком продуктов
    if (catalogState.messageId && catalogState.messageId !== catalogState.lastProductsMessageId) {
      await safeDelete(bot, chatId, catalogState.messageId);
    }

    // создаем новое сообщение каталога
    const newMessage = await bot.sendMessage(chatId, options.text, {
      parse_mode: options.parse_mode,
      reply_markup: { inline_keyboard: keyboard },
    });

    newMessageId = newMessage.message_id;

    // сбрасываем флаг
    updateSectionState(chatId, SECTION.CATALOG, (prev) => ({
      ...prev,
      messageId: newMessageId,
      hasFileBelow: false,
    }));
  } else {
    // 🟢 1. Первый вход в раздел
    if (!sectionMessageId) {
      const newMessage = await bot.sendMessage(chatId, options.text, {
        parse_mode: options.parse_mode,
        reply_markup: {inline_keyboard: keyboard},
      });

      newMessageId = newMessage.message_id;

      // 🔹 первый вход в каталог
      if (currentSection === SECTION.CATALOG && activeMessageId) {
        try {
          const isProductsMessage =
            activeMessageId === catalogState?.lastProductsMessageId;

          if (!isProductsMessage) {
            await safeDelete(bot, activeMessageId);
          }
        } catch (e) {
          console.error("Error deleting message:", e);
        }
      }
    }
    // 🟡 2. Мы уже в этом разделе → редактируем
    else if (sectionMessageId === activeMessageId) {
      // 🔹 действие НЕ в каталоге ИЛИ последнее сообщение не с товарами
      if (currentSection !== SECTION.CATALOG || !catalogState?.lastProductsMessageId) {
        try {
          await bot.editMessageText(options.text, {
            chat_id: chatId,
            message_id: sectionMessageId,
            parse_mode: options.parse_mode,
            reply_markup: {inline_keyboard: keyboard},
          });
        } catch (e: any) {
          if (!e.response?.body?.description?.includes("message is not modified")) {
            throw e;
          }
        }

        newMessageId = sectionMessageId;

        if (currentSection === SECTION.CATALOG && catalogState?.flowStep === "products") {
          updateSectionState(chatId, SECTION.CATALOG, (prev) => ({
            ...prev,
            flowStep: prev.flowStep || "brands",
            lastProductsMessageId: newMessageId,
          }));
        }
      }
      // 🔹 действие в каталоге И последнее сообщение с товарами
      else {
        const newMessage = await bot.sendMessage(chatId, options.text, {
          parse_mode: options.parse_mode,
          reply_markup: {inline_keyboard: keyboard},
        });

        newMessageId = newMessage.message_id;

        updateSectionState(chatId, SECTION.CATALOG, (prev) => ({
          ...prev,
          flowStep: prev.flowStep || "brands",
          lastProductsMessageId:
            prev.flowStep === "products"
              ? newMessageId
              : undefined,
        }));
      }
    }
    // 🔵 3. Возврат в раздел (сообщение старое)
    else {
      const newMessage = await bot.sendMessage(chatId, options.text, {
        parse_mode: options.parse_mode,
        reply_markup: {inline_keyboard: keyboard},
      });

      newMessageId = newMessage.message_id;

      if (currentSection !== SECTION.CATALOG || !catalogState?.lastProductsMessageId) {
        try {
          await safeDelete(bot, sectionMessageId);
        } catch (e: any) {
          console.error("Error deleting message:", e);
        }
      }

      if (currentSection === SECTION.CATALOG) {
        setChatState(chatId, {
          activeMessageId: newMessageId,
        });

        updateSectionState(chatId, SECTION.CATALOG, (prev) => ({
          ...prev,
          messageId: newMessageId,
          lastProductsMessageId: undefined,
          flowStep: prev.flowStep || "brands",
        }));
      }
    }
  }

  setChatState(chatId, {
    section: options.section,
    activeMessageId: newMessageId,
  });

  updateSectionState(chatId, currentSection, (prev) => ({
    ...prev,
    messageId: newMessageId,
  }));
}
