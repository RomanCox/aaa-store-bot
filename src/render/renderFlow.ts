import TelegramBot from "node-telegram-bot-api";
import { buildDownloadCallback, getBrands, getCategories, getModels, getStorageValues } from "../utils";
import { getChatState, getSectionState, setChatState } from "../state/chat.state";
import {
  brandsKeyboard,
  cartRootKeyboard,
  categoriesKeyboard,
  choosingAmountKeyboard,
  choosingProductKeyboard,
  modelsKeyboard,
  storageValuesKeyboard
} from "../keyboards";
import { CART_TEXTS, CATALOG_TEXTS } from "../texts";
import {
	CartSectionState,
	CatalogSectionState,
	Product, ProductFilters,
	ProductForCart,
	SECTION, UserRole
} from "../types";
import { renderProductsList } from "./renderProductsList";
import { editCartKeyboard } from "../keyboards/editCart.keyboard";
import { getCurrency } from "../services/price.service";
import { editProductInCartKeyboard } from "../keyboards/editProductInCart.keyboard";
import { renderScreen } from "./renderScreen";
import { getCatalogProductById, getCatalogUIProducts } from "../services/catalog/ui/catalog.ui";
import { getUserRole } from "../services/users.service";

async function renderRoot(bot: TelegramBot, chatId: number) {
	const state = getChatState(chatId);

	const buildText = (order: ProductForCart[] = []) => {
		if (!order.length) {
			return (
				CART_TEXTS.CART_TITLE +
				"\n\n" +
				CART_TEXTS.EMPTY_CART
			);
		}
		const currency = getCurrency(chatId);

		let totalSum = 0;

		const lines = order.map((item, index) => {
			const price = Number(item.price);
			const amount = item.amount;
			const country = item.country ?? "";
			const sim = item.sim ?? "";
			const active = item.activated ? "Active" : ""

			const itemTotal = price * amount;
			totalSum += itemTotal;

			return (
				`${index + 1}. <i>${item.name} ${country} (${sim}) (${active})</i>\n` +
				`  📦 ${amount} шт. × ${price} ${currency} = ${itemTotal} ${currency}`
			);
		});

		return (
			CART_TEXTS.CART_TITLE +
			"\n\n" +
			lines.join("\n\n") +
			"\n\n" +
			`💰 Итого: ${totalSum} ${currency}`
		);
	};

  await renderScreen(bot, chatId, {
    section: SECTION.CART,
    text: buildText(state.sections.cart?.currentOrder),
    inlineKeyboard: cartRootKeyboard(state.sections.cart?.currentOrder),
    parse_mode: "HTML",
  });
}

async function renderEditCart (bot: TelegramBot, chatId: number) {
	const state = getChatState(chatId);

	const buildText = (order: ProductForCart[] = []) => {
		if (!order.length) {
			return CART_TEXTS.EMPTY_CART;
		}

		const lines = order.map((item, index) => {
			const amount = item.amount;

			return `🔷 ${index + 1}. ${item.name} × ${amount}`;
		});

		return (
			CART_TEXTS.EDIT_CART +
			lines.join("\n") +
			"\n\n" +
			CART_TEXTS.EDIT_CART_DESCRIPTION
		);
	};

  await renderScreen(bot, chatId, {
    section: SECTION.CART,
    text: buildText(state.sections.cart?.currentOrder),
    inlineKeyboard: editCartKeyboard(chatId),
    parse_mode: "HTML",
    withBackButton: true,
  });
	return;
}

async function renderEditProductInCart (bot: TelegramBot, chatId: number) {
	const state = getChatState(chatId);
	const product =
    state.sections.cart?.currentOrder?.find(({ id } ) => id === state.sections.cart?.selectedProductIdForCart);

	const buildText = (product: ProductForCart | undefined) => {
		if (!state.sections.cart?.currentOrder?.length || !product) {
			return CART_TEXTS.ERROR_PRODUCT_IN_CART;
		}

		const currency = getCurrency(chatId);

		return (
			`🛍 <b>${product.name}</b>\n` +
			CART_TEXTS.CART_PRICE + product.price + " " + currency +
			CART_TEXTS.PRODUCT_AMOUNT + product.amount +
			CART_TEXTS.EDIT_PRODUCT_IN_CART +
			CART_TEXTS.INCREASE_AMOUNT +
			(product.amount > 1 ? "\n" + CART_TEXTS.DECREASE_AMOUNT : "") +
			CART_TEXTS.CHANGE_AMOUNT +
			CART_TEXTS.DELETE_PRODUCT_FROM_CART
		)
	}

  await renderScreen(bot, chatId, {
    section: SECTION.CART,
    text: buildText(product),
    inlineKeyboard: editProductInCartKeyboard(chatId),
    parse_mode: "HTML",
    withBackButton: true,
  });
}

export async function renderBrands(
  bot: TelegramBot,
  chatId: number,
  section: SECTION
) {
  const state = getChatState(chatId);
  const sectionState = getSectionState(state, section);
  if (!sectionState) return;

	const filters: ProductFilters = {};

	const role = getUserRole(chatId);
  const products = getCatalogUIProducts(filters, role);
  const brands = getBrands(products);

  if (!brands.length) {
		setChatState(chatId, {
			mode: "error",
		})

    await renderScreen(bot, chatId, {
      section: section,
      text: CATALOG_TEXTS.UNAVAILABLE,
			withBackButton: true,
    });
    return;
  }

  await renderScreen(bot, chatId, {
    section: section,
    text: CATALOG_TEXTS.CHOOSE_BRAND,
    inlineKeyboard: brandsKeyboard(brands, {
      withAllBtn: section === SECTION.CATALOG,
      withDownloadBtn: section === SECTION.CATALOG,
      downloadKey: buildDownloadCallback(filters),
    }),
    withBackButton: section === SECTION.CART && !!state.sections.cart?.currentOrder?.length
  });
}

export async function renderCategories(
  bot: TelegramBot,
  chatId: number,
  section: SECTION
) {
  const state = getChatState(chatId);
  const sectionState = getSectionState(state, section);
  if (!sectionState) return;

  let selectedBrand: string | undefined;
  if (section === SECTION.CATALOG) {
    selectedBrand = (sectionState as CatalogSectionState).selectedBrand;
  } else if (section === SECTION.CART) {
    selectedBrand = (sectionState as CartSectionState).selectedBrand;
  }
  if (!selectedBrand) {
		setChatState(chatId, {
			mode: "error",
		})

    await renderScreen(bot, chatId, {
      section: section,
      text: CATALOG_TEXTS.UNAVAILABLE,
			withBackButton: true,
    });
    return;
  }

	const filters: ProductFilters = { brand: selectedBrand };

	const role = getUserRole(chatId);
  const products = getCatalogUIProducts(filters, role);
  const categories = getCategories(products, selectedBrand);
  const downloadKey = buildDownloadCallback(filters);

  if (!categories.length) {
		setChatState(chatId, {
			mode: "error",
		})

    await renderScreen(bot, chatId, {
      section: section,
      text: CATALOG_TEXTS.UNAVAILABLE,
			withBackButton: true,
    });
    return;
  }

  const text =
    section === SECTION.CATALOG
      ? CATALOG_TEXTS.CHOOSE_CATEGORY + selectedBrand + ":"
      : CART_TEXTS.YOU_CHOOSE + CART_TEXTS.CHOSE_BRAND + selectedBrand;

  await renderScreen(bot, chatId, {
    section: section,
    text,
    inlineKeyboard: categoriesKeyboard(categories, {
      withAllBtn: section === SECTION.CATALOG,
      withDownloadBtn: section === SECTION.CATALOG,
      downloadKey
    }),
    parse_mode: "HTML",
  });
}

async function renderModels(bot: TelegramBot, chatId: number) {
	const state = getChatState(chatId);
  const sectionState = getSectionState(state, SECTION.CART);
  if (!sectionState) return;

	const filters: ProductFilters = {
		brand: sectionState.selectedBrand,
		category: sectionState.selectedCategory,
	};

	const role = getUserRole(chatId);
	const products = getCatalogUIProducts(filters, role);

	const models = getModels(products, sectionState.selectedBrand, sectionState.selectedCategory);

	if (!sectionState.selectedBrand || !sectionState.selectedCategory || !models.length) {
		setChatState(chatId, {
			mode: "error",
		})

    await renderScreen(bot, chatId, {
      section: SECTION.CART,
      text: CATALOG_TEXTS.UNAVAILABLE,
			withBackButton: true,
    });
		return;
	}

	const text =
		CART_TEXTS.YOU_CHOOSE +
		CART_TEXTS.CHOSE_BRAND +
		`<b>${sectionState.selectedBrand}</b>` +
		CART_TEXTS.CHOSE_CATEGORY +
		`<b>${sectionState.selectedCategory}</b>` +
		CART_TEXTS.CHOOSE_MODEL;

  await renderScreen(bot, chatId, {
    section: SECTION.CART,
    text,
    inlineKeyboard: modelsKeyboard(models),
    parse_mode: "HTML",
    withBackButton: true,
  });
}

async function renderStorage(bot: TelegramBot, chatId: number) {
	const state = getChatState(chatId);
  const sectionState = getSectionState(state, SECTION.CART);
  if (!sectionState) return;

	const filters: ProductFilters = {
		brand: sectionState.selectedBrand,
		category: sectionState.selectedCategory,
		model: sectionState.selectedModel,
	};

	const role = getUserRole(chatId);
	const products = getCatalogUIProducts(filters, role);

	const storageValues = getStorageValues(
		products, sectionState.selectedBrand, sectionState.selectedCategory, sectionState.selectedModel
	);

	if (
		!sectionState.selectedBrand ||
		!sectionState.selectedCategory ||
		!sectionState.selectedModel ||
		!storageValues.length
	) {
		setChatState(chatId, {
			mode: "error",
		})

    await renderScreen(bot, chatId, {
      section: SECTION.CART,
      text: CATALOG_TEXTS.UNAVAILABLE,
			withBackButton: true,
    });
		return;
	}

	const text =
		CART_TEXTS.YOU_CHOOSE +
		CART_TEXTS.CHOSE_BRAND +
		`<b>${sectionState.selectedBrand}</b>` +
		CART_TEXTS.CHOSE_CATEGORY +
		`<b>${sectionState.selectedCategory}</b>` +
		CART_TEXTS.CHOSE_MODEL +
		`<b>${sectionState.selectedModel}</b>` +
		CART_TEXTS.CHOOSE_STORAGE;

  await renderScreen(bot, chatId, {
    section: SECTION.CART,
    text,
    inlineKeyboard: storageValuesKeyboard(storageValues),
    parse_mode: "HTML",
    withBackButton: true,
  });
}

async function renderChoosingProduct(bot: TelegramBot, chatId: number) {
	const state = getChatState(chatId);
  const sectionState = getSectionState(state, SECTION.CART);
  if (!sectionState) return;

	const filters: ProductFilters = {
		brand: sectionState.selectedBrand,
		category: sectionState.selectedCategory,
		model: sectionState.selectedModel,
		storage: sectionState.selectedStorage,
	};

	const userRole = getUserRole(chatId);
	const products = getCatalogUIProducts(filters, userRole);
	const notActivated = products.filter(p => !p.activated);
  const activated = products.filter(p => p.activated);
	const sortedProducts = [...notActivated, ...activated];

	if (
		!sectionState.selectedBrand ||
		!sectionState.selectedCategory ||
		!sectionState.selectedModel ||
		!products.length
	) {
		setChatState(chatId, {
			mode: "error",
		})

    await renderScreen(bot, chatId, {
      section: SECTION.CART,
      text: CATALOG_TEXTS.UNAVAILABLE,
			withBackButton: true,
    });
		return;
	}

	const buildText = (products: Product[], userRole?: UserRole) => {
		const lines = sortedProducts.map((item, index) => {
			const price = Number(item.price);
			const currency = userRole === "retail" ? "р." : "";
			const country = item.country ?? "";
			const sim = item.sim ?? "";
			const active = item.activated ? "Active" : ""

			let line = `${index + 1}. ${item.name} - ${price}${currency}`;

			if (country) {
				line += ` ${sim}`;
			}

			if (sim) {
				line += ` 📲 ${sim}`; // или line += ` (${sim})`
			}

			if (active) {
				line += ` ✅ ${active}`;
			}

			return line;
		});

		return (
			CART_TEXTS.YOU_CHOOSE +
			CART_TEXTS.CHOSE_BRAND +
			`<b>${sectionState.selectedBrand}</b>` +
			CART_TEXTS.CHOSE_CATEGORY +
			`<b>${sectionState.selectedCategory}</b>` +
			CART_TEXTS.CHOSE_MODEL +
			`<b>${sectionState.selectedModel}</b>` +
			CART_TEXTS.CHOSE_STORAGE +
			`<b>${sectionState.selectedStorage}</b>` +
			CART_TEXTS.CHOOSE_PRODUCT +
			lines.join("\n")
		);
	};

  await renderScreen(bot, chatId, {
    section: SECTION.CART,
    text: buildText(sortedProducts, userRole),
    inlineKeyboard: choosingProductKeyboard(chatId, sortedProducts),
    parse_mode: "HTML",
  });
}

async function renderAmount(bot: TelegramBot, chatId: number) {
	const state = getChatState(chatId);
  const sectionState = getSectionState(state, SECTION.CART);
  if (!sectionState) return;

	const userRole = getUserRole(chatId);
	const product = getCatalogProductById(sectionState.selectedProductId, userRole);

	if (!sectionState.selectedBrand || !product) {
    await renderScreen(bot, chatId, { section: SECTION.CART, text: CART_TEXTS.PRODUCT_UNAVAILABLE });
		return;
	}

	const currency = userRole === "retail" ? "р." : "";

	let header = product.name;
	if (product.country) header += ` ${product.country}`;
	if (product.sim) header += ` (${product.sim})`;
	if (product.activated) header += ' (Active)';

	const text = `${header}\n${CART_TEXTS.CART_PRICE}${product.price}${currency}\n${CART_TEXTS.CHOOSE_AMOUNT}`;

  await renderScreen(bot, chatId, {
    section: SECTION.CART,
    text,
    inlineKeyboard: choosingAmountKeyboard(),
    parse_mode: "HTML",
    withBackButton: true,
  });
}

export async function renderFlow(bot: TelegramBot, chatId: number) {
	const state = getChatState(chatId);
  const cartState = getSectionState(state, SECTION.CART);
  if (!cartState) return;

	const filters: ProductFilters = {
		brand: cartState.selectedBrand,
		category: cartState.selectedCategory,
	};

	const role = getUserRole(chatId);
	const products = getCatalogUIProducts(filters, role);

	if (!products || products.length === 0) {
		setChatState(chatId, {
			mode: "error",
		})

    await renderScreen(bot, chatId, {
			section: SECTION.CART,
			text: CATALOG_TEXTS.UNAVAILABLE,
			withBackButton: true,
		});
		return;
	}

  switch (state.section) {

    case SECTION.CATALOG: {
      const flowStep = state.sections.catalog?.flowStep ?? "main";

      switch (flowStep) {
        case "brands":
          return renderBrands(bot, chatId, SECTION.CATALOG);

        case "categories":
          return renderCategories(bot, chatId, SECTION.CATALOG);

        case "products":
          return renderProductsList(bot, chatId);

        default:
          return renderBrands(bot, chatId, SECTION.CATALOG);
      }
    }

    case SECTION.CART: {
      const flowStep = state.sections.cart?.flowStep ?? "main";

      switch (flowStep) {
        case "main":
          return renderRoot(bot, chatId);

        case "brands":
          return renderBrands(bot, chatId, SECTION.CART);

        case "categories":
          return renderCategories(bot, chatId, SECTION.CART);

        case "models":
          return renderModels(bot, chatId);

        case "storage":
          return renderStorage(bot, chatId);

        case "products_for_cart":
          return renderChoosingProduct(bot, chatId);

        case "amount":
          return renderAmount(bot, chatId);

        case "edit_cart":
          return renderEditCart(bot, chatId);

        case "edit_product_in_cart":
          return renderEditProductInCart(bot, chatId);

        default:
          return renderRoot(bot, chatId);
      }
    }

    default:
      return renderRoot(bot, chatId);
  }
}
