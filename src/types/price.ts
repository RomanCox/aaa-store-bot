import { ChatMode } from "./chat";

export interface IRates {
  rub_to_byn: number;
  rub_to_usd: number;
}

export type PriceType = "wholesale" | "retail";

export interface PriceRule {
  max?: number;
  type: PriceType;
  percent: number;
}

export interface PriceFormat {
  category?: string;
  brand?: string;
  prices: PriceRule[];
}

export type PriceFormationUpdate = { type: ChatMode; value: number };