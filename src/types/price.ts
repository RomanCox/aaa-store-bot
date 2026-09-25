import { ChatMode } from "./chat";

export interface Rates {
  rub_to_byn: number;
  rub_to_usd: number;
  usd_to_byn: number;
}

export type PriceType = "wholesale" | "retail";

export interface PriceRule {
  max?: number;
  type: PriceType;
  value: number;
}

export interface PriceFormat {
  category?: string;
  brand?: string;
  // Ключевые слова из товара (по вхождению в name, без учёта регистра) —
  // выделяют временные правила наценки, например для новых моделей,
  // которые ещё не отличить от старых по категории+бренду+цене.
  keywords?: string[];
  prices: PriceRule[];
}

export type PriceFormationUpdate = { type: ChatMode; value: number };