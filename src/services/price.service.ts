import fs from "fs";
import path from "path";
import TelegramBot from "node-telegram-bot-api";
import { ChatMode, IRates, PriceFormat, PriceFormationUpdate, SECTION } from "../types";
import { setChatState } from "../state/chat.state";
import { PRICE_TEXTS } from "../texts";
import { getUserRole } from "./users.service";
import { renderScreen } from "../render/renderScreen";

const RATES_PATH = path.resolve(__dirname, "../data/rates.json");
const PRICE_FORMATION_PATH = path.resolve(__dirname, "../data/price_formation.json");
const DEFAULT_RATES: IRates = {
  rub_to_byn: 0,
  rub_to_usd: 0,
};
const DEFAULT_PRICE_FORMATION: PriceFormat[] = [];

let rates: IRates = DEFAULT_RATES;
let priceFormation: PriceFormat[] = DEFAULT_PRICE_FORMATION;

export function loadRates() {
  if (!fs.existsSync(RATES_PATH)) {
    console.log("No rates.json found.");
    rates = DEFAULT_RATES;
    return;
  }

  try {
    const raw = fs.readFileSync(RATES_PATH, "utf8");
    const parsed = JSON.parse(raw);

    rates = {
      rub_to_byn: Number(parsed?.rub_to_byn) || 0,
      rub_to_usd: Number(parsed?.rub_to_usd) || 0,
    };
  } catch (e) {
    console.error("❌ Ошибка чтения rates.json", e);
    rates = DEFAULT_RATES;
  }
}

export function getRates(): IRates {
  return rates;
}

export async function saveRates(update: PriceFormationUpdate) {
  const newRates = getRates();

  switch (update.type) {
    case "edit_rub_to_byn":
      rates.rub_to_byn = update.value;
      break;

    case "edit_rub_to_usd":
      rates.rub_to_usd = update.value;
      break;
  }

  fs.writeFileSync(
    PRICE_FORMATION_PATH,
    JSON.stringify(newRates, null, 2),
    "utf-8"
  );

  rates = newRates;
}

export async function editRates(
  bot: TelegramBot,
  chatId: number,
  ratesEditType: ChatMode
) {
  setChatState(chatId, {
    mode: ratesEditType,
  });

  const textGenerate = (ratesEditType: ChatMode) => {
    if (ratesEditType === "edit_rub_to_byn") return PRICE_TEXTS.ENTER_RUB_TO_BYN;
    return PRICE_TEXTS.ENTER_RUB_TO_USD;
  };

  await renderScreen(bot, chatId, {
    section: SECTION.ADMIN_PANEL,
    text: textGenerate(ratesEditType),
    withBackButton: true,
  });

  return;
}

export function loadPriceFormation() {
	if (!fs.existsSync(PRICE_FORMATION_PATH)) {
		priceFormation = DEFAULT_PRICE_FORMATION;
		return;
	}

	try {
		const raw = fs.readFileSync(PRICE_FORMATION_PATH, "utf8");

		priceFormation = JSON.parse(raw);
	} catch (e) {
		console.error("❌ Ошибка чтения price_formation.json", e);
		priceFormation = DEFAULT_PRICE_FORMATION;
	}
}

export function getPriceFormation(): PriceFormat[] {
	return priceFormation;
}

export async function savePriceFormation(update: PriceFormat[]) {
	fs.writeFileSync(
		PRICE_FORMATION_PATH,
		JSON.stringify(update, null, 2),
		"utf-8"
	);

	priceFormation = update;
}

// export async function editPriceFormation(
//   bot: TelegramBot,
//   chatId: number,
//   priceEditType: ChatMode
// ) {
//   setChatState(chatId, {
//     mode: priceEditType,
//   });
//
//   const textGenerate = (priceEditType: ChatMode) => {
//     switch (priceEditType) {
//       case "edit_rub_to_byn":
//         return PRICE_TEXTS.ENTER_RUB_TO_BYN;
//       case "edit_rub_to_usd":
//         return PRICE_TEXTS.ENTER_RUB_TO_USD;
//       case "edit_retail_mult":
//         return PRICE_TEXTS.ENTER_RETAIL_MULT;
//       case "edit_wholesale_mult":
//         return PRICE_TEXTS.ENTER_WHOLESALE_MULT;
//       default:
//         return PRICE_TEXTS.ENTER_RUB_TO_BYN;
//     }
//   };
//
//   await renderScreen(bot, chatId, {
//     section: SECTION.MAIN,
//     text: textGenerate(priceEditType),
//     withBackButton: true,
//   });
//
//   return;
// }

export function getCurrency(userId: number) {
	const userRole = getUserRole(userId);

	return userRole === "retail" ? "BYN" : userRole === "wholesale" ? "USD" : "₽";
}