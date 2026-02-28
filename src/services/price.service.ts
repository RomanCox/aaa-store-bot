import fs from "fs";
import path from "path";
import TelegramBot from "node-telegram-bot-api";
import { CALLBACK_TYPE, ChatMode, PriceFormation, PriceFormationUpdate, SECTION } from "../types";
import { setChatState } from "../state/chat.state";
import { COMMON_TEXTS, PRICE_TEXTS } from "../texts";
import { getUserRole } from "./users.service";
import { renderScreen } from "../render/renderScreen";

const PRICE_FORMATION_PATH = path.resolve(__dirname, "../data/price_formation.json");
const DEFAULT_PRICE_FORMATION: PriceFormation = {
	rates: {
		rub_to_byn: 0,
		rub_to_usd: 0,
	},
	multipliers: {
		retail: 0,
		wholesale: 0,
	},
};

let priceFormation: PriceFormation = DEFAULT_PRICE_FORMATION;

export function loadPriceFormation() {
	if (!fs.existsSync(PRICE_FORMATION_PATH)) {
		priceFormation = DEFAULT_PRICE_FORMATION;
		return;
	}

	try {
		const raw = fs.readFileSync(PRICE_FORMATION_PATH, "utf8");
		const parsed = JSON.parse(raw);

		priceFormation = {
			rates: {
				rub_to_byn: Number(parsed?.rates?.rub_to_byn) || 0,
				rub_to_usd: Number(parsed?.rates?.rub_to_usd) || 0,
			},
			multipliers: {
				retail: Number(parsed?.multipliers?.retail) || 0,
				wholesale: Number(parsed?.multipliers?.wholesale) || 0,
			},
		};
	} catch (e) {
		console.error("❌ Ошибка чтения price_formation.json", e);
		priceFormation = DEFAULT_PRICE_FORMATION;
	}
}

export function getPriceFormation(): PriceFormation {
	return priceFormation;
}

export async function savePriceFormation(update: PriceFormationUpdate) {
	const current = getPriceFormation();

	const next: PriceFormation = {
		rates: { ...current.rates },
		multipliers: { ...current.multipliers },
	};

	switch (update.type) {
		case "edit_rub_to_byn":
			next.rates.rub_to_byn = update.value;
			break;

		case "edit_rub_to_usd":
			next.rates.rub_to_usd = update.value;
			break;

		case "edit_retail_mult":
			next.multipliers.retail = update.value;
			break;

		case "edit_wholesale_mult":
			next.multipliers.wholesale = update.value;
			break;
	}

	fs.writeFileSync(
		PRICE_FORMATION_PATH,
		JSON.stringify(next, null, 2),
		"utf-8"
	);

	priceFormation = next;
}

export async function editPriceFormation(
  bot: TelegramBot,
  chatId: number,
  priceEditType: ChatMode
) {
  setChatState(chatId, {
    mode: priceEditType,
  });

  const textGenerate = (priceEditType: ChatMode) => {
    switch (priceEditType) {
      case "edit_rub_to_byn":
        return PRICE_TEXTS.ENTER_RUB_TO_BYN;
      case "edit_rub_to_usd":
        return PRICE_TEXTS.ENTER_RUB_TO_USD;
      case "edit_retail_mult":
        return PRICE_TEXTS.ENTER_RETAIL_MULT;
      case "edit_wholesale_mult":
        return PRICE_TEXTS.ENTER_WHOLESALE_MULT;
      default:
        return PRICE_TEXTS.ENTER_RUB_TO_BYN;
    }
  };

  await renderScreen(bot, chatId, {
    section: SECTION.MAIN,
    text: textGenerate(priceEditType),
    withBackButton: true,
  });

  return;
}

export function getCurrency(userId: number) {
	const userRole = getUserRole(userId);

	return userRole === "retail" ? "BYN" : userRole === "wholesale" ? "USD" : "₽";
}