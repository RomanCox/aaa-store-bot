import TelegramBot from "node-telegram-bot-api";
import { getChatState, setChatState } from "../state/chat.state";
import { SECTION } from "../types";

export async function handleBack(bot: TelegramBot, chatId: number) {
  const state = getChatState(chatId);
  const adminState = state.sections?.[SECTION.ADMIN_PANEL];

  if (!adminState) return;

  if (adminState.flowStep === "upload_xlsx") {
    setChatState(chatId, {
      mode: "idle",
      sections: {
        ...state.sections,
        [SECTION.ADMIN_PANEL]: {
          ...adminState,
          flowStep: "main",
        },
      },
    });
    return;
  }

  if (
    adminState.flowStep === "users_list" ||
    adminState.flowStep === "add_user" ||
    adminState.flowStep === "edit_user" ||
    adminState.flowStep === "delete_user"
  ) {
    setChatState(chatId, {
      mode: "idle",
      sections: {
        ...state.sections,
        [SECTION.ADMIN_PANEL]: {
          ...adminState,
          flowStep: "manage_users",
        },
      },
    });

    return;
  }

  if (adminState.flowStep === "manage_users") {
    setChatState(chatId, {
      sections: {
        ...state.sections,
        [SECTION.ADMIN_PANEL]: {
          ...adminState,
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
          section: SECTION.ADMIN_PANEL,
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
  return;
}
