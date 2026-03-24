import fs from "fs";
import TelegramBot from "node-telegram-bot-api";
import { ChatMode, Rates, PriceFormat, PriceFormationUpdate, SECTION } from "../types";
import { setChatState } from "../state/chat.state";
import { PRICE_TEXTS } from "../texts";
import { getUserRole } from "./users.service";
import { renderScreen } from "../render/renderScreen";
import { PRICE_FORMATION_PATH, RATES_PATH } from "../constants";

const DEFAULT_RATES: Rates = {
  rub_to_byn: 0,
  rub_to_usd: 0,
};
const DEFAULT_PRICE_FORMATION: PriceFormat[] = [];

let rates: Rates = DEFAULT_RATES;
let priceFormation: PriceFormat[] = DEFAULT_PRICE_FORMATION;

export function loadRates() {
  if (!fs.existsSync(RATES_PATH)) {
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

export function getRates(): Rates {
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
    RATES_PATH,
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

export function getCurrency(userId: number) {
	const userRole = getUserRole(userId);

	return userRole === "retail" ? "BYN" : userRole === "wholesale" ? "USD" : "₽";
}