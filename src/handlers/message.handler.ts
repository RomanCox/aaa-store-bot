import TelegramBot from "node-telegram-bot-api";
import { CART_TEXTS, MENU_TEXTS } from "../texts";
import { removeNavigationMessage } from "../utils";
import { getChatState, setChatState } from "../state/chat.state";
import { ProductForCart, SECTION } from "../types";
import { deleteUserInputHandler } from "./users/deleteUser.handler";
import { editUserInputHandler } from "./users/editUser.handler";
import { addUserInputHandler } from "./users/addUser.handler";
import { editPriceInputHandler } from "./price.handler";
import { getProductById } from "../services/products.service";
import { renderFlow } from "./renderFlow";
import { ordersHandler, ordersPageInputHandler } from "./orders.handler";
import { usersPageInputHandler } from "../services/users.service";
import { renderScreen } from "../render/renderScreen";

export function registerMessages(bot: TelegramBot) {
	bot.on("message", async (msg) => {
		const chatId = msg.chat.id;
		const text = msg.text;

		if (!text) return;

		const state = getChatState(chatId);

    if (state.mode === "add_user") {
			await addUserInputHandler(bot, chatId, text);
      return;
    }

		if (state.mode === "delete_user") {
			await deleteUserInputHandler(bot, chatId, text);
			return;
		}

    if (state.mode === "edit_user") {
      await editUserInputHandler(bot, chatId, text);
      return;
    }

		if (
			["edit_rub_to_byn", "edit_rub_to_usd", "edit_retail_mult", "edit_wholesale_mult"].includes(state.mode)
		) {
			await editPriceInputHandler(bot, chatId, text);
			return;
		}

		if (state.mode === "await_users_page_number") {
			await usersPageInputHandler(bot, chatId, text);
			setChatState(chatId, { mode: "idle" });
			return;
		}

    if (state.mode === "await_orders_page_number") {
      await ordersPageInputHandler(bot, chatId, text);
      setChatState(chatId, { mode: "idle" });
      return;
    }

    if (state.mode === "choose_userId_for_orders") {
      await ordersHandler(bot, chatId, text);
      setChatState(chatId, { mode: "idle" });
      return;
    }

		if (state.mode === "amount_product_for_cart") {
			if (Number.isNaN(text)) {
        await renderScreen(bot, chatId, CART_TEXTS.AMOUNT_WILL_BE_NUMBER);
				return;
			}

			const choseProduct = getProductById(chatId, state.selectedProductId);

			if (!choseProduct) {
        await renderScreen(bot, chatId, CART_TEXTS.PRODUCT_UNAVAILABLE);
				return;
			}

			const productForOrder: ProductForCart = {
				...choseProduct,
				amount: Number(text),
			};

			const currentOrder = [ ...(state.currentOrder || []), productForOrder ];

			setChatState(chatId, {
				mode: "idle",
				selectedProductId: undefined,
				flowStep: "products_for_cart",
				currentOrder,
			});

			await renderFlow(bot, chatId);
			return;
		}

		if (state.mode === "edit_product_amount_in_cart") {
			if (!state.currentOrder?.length || state.selectedProductIdForCart || Number.isNaN(text)) {
				return;
			}

			const updatedOrder = state.currentOrder.map(product =>
				product.id === state.selectedProductIdForCart
					? { ...product, amount: Number(text) }
					: product
			);

			setChatState(chatId, {
				currentOrder: updatedOrder,
			});

			await renderFlow(bot, chatId);
			return;
		}

		switch (text) {
			case MENU_TEXTS.CATALOG:
				await removeNavigationMessage(bot, chatId);
        setChatState(chatId, {
					section: SECTION.CATALOG,
					flowStep: "brands",
					selectedBrand: undefined,
					selectedCategory: undefined,
					selectedModel: undefined,
					selectedStorage: undefined,
					selectedProductId: undefined,
          replyMessageId: msg.message_id,
        });
				await renderFlow(bot, chatId);
				break;

			case MENU_TEXTS.ORDERS:
				await removeNavigationMessage(bot, chatId);
        setChatState(chatId, {
					section: SECTION.ORDERS,
					selectedBrand: undefined,
					selectedCategory: undefined,
					selectedModel: undefined,
					selectedStorage: undefined,
					selectedProductId: undefined,
          replyMessageId: msg.message_id,
        });

        await ordersHandler(bot, chatId);
				break;

			case MENU_TEXTS.CART:
				await removeNavigationMessage(bot, chatId);
        setChatState(chatId, {
					section: SECTION.CART,
					flowStep: "main",
					selectedBrand: undefined,
					selectedCategory: undefined,
					selectedModel: undefined,
					selectedStorage: undefined,
					selectedProductId: undefined,
          replyMessageId: msg.message_id,
        });
				await renderFlow(bot, chatId);
				break;

			default: break;
		}
	});
}
