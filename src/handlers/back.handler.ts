import TelegramBot from "node-telegram-bot-api";
import { getChatState, setChatState } from "../state/chat.state";
import { SECTION } from "../types";
import { startUserManagement } from "../services/admin.service";

export async function handleBack(bot: TelegramBot, chatId: number) {
  const state = getChatState(chatId);
  const mainState = state.sections?.[SECTION.MAIN];

  if (!mainState) return;

  if (mainState.flowStep === "upload_xlsx") {
    setChatState(chatId, {
      mode: "idle",
      sections: {
        ...state.sections,
        [SECTION.MAIN]: {
          ...mainState,
          flowStep: "main",
        },
      },
    });
    return;
  }

  if (
    mainState.flowStep === "users_list" ||
    mainState.flowStep === "add_user" ||
    mainState.flowStep === "edit_user" ||
    mainState.flowStep === "delete_user"
  ) {
    setChatState(chatId, {
      mode: "idle",
      sections: {
        ...state.sections,
        [SECTION.MAIN]: {
          ...mainState,
          flowStep: "manage_users",
        },
      },
    });

    await startUserManagement(bot, chatId);
    return;
  }

  if (mainState.flowStep === "manage_users") {
    setChatState(chatId, {
      sections: {
        ...state.sections,
        [SECTION.MAIN]: {
          ...mainState,
          flowStep: "main",
        },
      },
    });
    return;
  }

	if (state.section === SECTION.CATALOG) {
    const catalogState = state.sections?.[SECTION.CATALOG];

    if (!catalogState) return;

    switch (catalogState.flowStep) {
      // 🔹 Назад из брендов → в main
      case "brands":
        setChatState(chatId, {
          sections: {
            ...state.sections,
            [SECTION.CATALOG]: {
              ...catalogState,
              flowStep: "brands",
              selectedBrand: undefined,
              selectedCategory: undefined,
            },
          },
          section: SECTION.MAIN,
        });
        return;

      // 🔹 Назад из категорий → к брендам
      case "categories":
        setChatState(chatId, {
          sections: {
            ...state.sections,
            [SECTION.CATALOG]: {
              ...catalogState,
              flowStep: "brands",
              selectedBrand: undefined,
              selectedCategory: undefined,
            },
          },
        });
        return;

      // 🔹 Назад из продуктов → к категориям
      case "products":
        setChatState(chatId, {
          sections: {
            ...state.sections,
            [SECTION.CATALOG]: {
              ...catalogState,
              flowStep: "categories",
              selectedCategory: undefined,
            },
          },
        });
        return;
    }
	}

	if (state.section === SECTION.CART) {
    const cartState = state.sections?.[SECTION.CART];

    if (!cartState) return;

    switch (cartState.flowStep) {
      // 🔹 Назад из main корзины → в MAIN
      case "main":
        setChatState(chatId, {
          section: SECTION.MAIN,
          sections: {
            ...state.sections,
            [SECTION.CART]: {
              ...cartState,
              flowStep: "main",
            },
          },
        });
        return;

      // 🔹 Назад из брендов → в main корзины
      case "brands":
        setChatState(chatId, {
          sections: {
            ...state.sections,
            [SECTION.CART]: {
              ...cartState,
              flowStep: "main",
            },
          },
        });
        return;

      // 🔹 Назад из категорий → к брендам
      case "categories":
        setChatState(chatId, {
          sections: {
            ...state.sections,
            [SECTION.CART]: {
              ...cartState,
              flowStep: "brands",
              selectedBrand: undefined,
            },
          },
        });
        return;

      // 🔹 Назад из моделей → к категориям
      case "models":
        setChatState(chatId, {
          sections: {
            ...state.sections,
            [SECTION.CART]: {
              ...cartState,
              flowStep: "categories",
              selectedCategory: undefined,
            },
          },
        });
        return;

      // 🔹 Назад из storage → к моделям
      case "storage":
        setChatState(chatId, {
          sections: {
            ...state.sections,
            [SECTION.CART]: {
              ...cartState,
              flowStep: "models",
              selectedModel: undefined,
            },
          },
        });
        return;

      // 🔹 Назад из списка продуктов → к storage
      case "products_for_cart":
        setChatState(chatId, {
          sections: {
            ...state.sections,
            [SECTION.CART]: {
              ...cartState,
              flowStep: "storage",
              selectedStorage: undefined,
            },
          },
        });
        return;

      // 🔹 Назад из ввода количества → к продуктам
      case "amount":
        setChatState(chatId, {
          sections: {
            ...state.sections,
            [SECTION.CART]: {
              ...cartState,
              flowStep: "products_for_cart",
              selectedProductId: undefined,
            },
          },
        });
        return;

      // 🔹 Назад из редактирования корзины → в main корзины
      case "edit_cart":
        setChatState(chatId, {
          sections: {
            ...state.sections,
            [SECTION.CART]: {
              ...cartState,
              flowStep: "main",
            },
          },
        });
        return;

      // 🔹 Назад из редактирования конкретного товара → к edit_cart
      case "edit_product_in_cart":
        setChatState(chatId, {
          sections: {
            ...state.sections,
            [SECTION.CART]: {
              ...cartState,
              flowStep: "edit_cart",
              selectedProductIdForCart: undefined,
            },
          },
        });
        return;
    }
	}
}
