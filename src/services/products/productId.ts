import crypto from "crypto";

function normalizeIdPart(str?: string) {
  if (!str) return "";
  return str.toLowerCase().replace(/\s+/g, "").trim();
}

export function generateId(input: {
  brand: string;
  category: string;
  // rawName: string;
  model: string;
  storage?: string;
  color?: string;
  country?: string;
  sim?: string;
  activated?: boolean;
  connectivity?: "WiFi" | "LTE" | "";
  chip?: string;
  displayFinish?: string;
}) {
  const raw = [
    normalizeIdPart(input.brand),
    normalizeIdPart(input.category),
    // normalizeIdPart(input.rawName),
    normalizeIdPart(input.model),
    normalizeIdPart(input.storage),
    normalizeIdPart(input.color),
    normalizeIdPart(input.country),
    normalizeIdPart(input.sim),
    normalizeIdPart(input.activated === undefined? "": String(input.activated)),
    normalizeIdPart(input.connectivity),
    normalizeIdPart(input.chip),
    normalizeIdPart(input.displayFinish),
  ]
    .filter(Boolean)
    .join("|");

  return crypto.createHash("md5").update(raw).digest("hex").slice(0, 12);
}