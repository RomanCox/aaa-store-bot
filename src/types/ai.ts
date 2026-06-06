export interface AIResponse {
  content: string;
  cost: number;
}

export type MatchResult =
  | { status: "matched"; productId: string; confidence: number }
  | { status: "no_match"; productId: ""; confidence: number }
  | { status: "low_confidence"; productId?: string; confidence: number }
  | { status: "error" };

export interface ProductCreationResult {
  status: "ok" | "unknown" | "low_confidence" | "error";
  confidence?: number;
  model?: string;
  name?: string;
  storage?: string;
  color?: string;
}

export interface ExtractedAttrs {
  model: string;
  connectivity: "WiFi" | "LTE" | "";
  chip: string;
}

export type LowConfidenceItem = {
  name: string;
  brand: string;
  category: string;
  model?: string;
  confidence: number;
  raw?: string;
};