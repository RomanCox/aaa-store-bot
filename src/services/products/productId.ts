import crypto from "crypto";

function normalizeIdPart(str?: string) {
  if (!str) return "";
  return str.toLowerCase().replace(/\s+/g, "").trim();
}

export function generateId(input: {
  brand: string;
  category: string;
  model: string;
  storage?: string;
  color?: string;
  country?: string;
  sim?: string;
  activated?: boolean;
  rawName?: string;
  // connectivity?: "WiFi" | "LTE" | "";
  // chip?: string;
  // displayFinish?: string;
}) {
  const raw = [
    normalizeIdPart(input.brand),
    normalizeIdPart(input.category),
    normalizeIdPart(input.model),
    normalizeIdPart(input.storage),
    normalizeIdPart(input.color),
    normalizeIdPart(input.country),
    normalizeIdPart(input.sim),
    // normalizeIdPart(input.activated === undefined? "": String(input.activated)),
    input.activated === true ? normalizeIdPart("true") : null,
    // normalizeIdPart(input.connectivity),
    // !isAppleSmartphone ? normalizeIdPart(input.connectivity) : null,
    // normalizeIdPart(input.chip),
    // normalizeIdPart(input.displayFinish),
    // input.displayFinish ? normalizeIdPart(input.displayFinish) : null,
    input.rawName ? normalizeIdPart(input.rawName) : null
  ]
    .filter(Boolean)
    .join("|");

  return crypto.createHash("md5").update(raw).digest("hex").slice(0, 12);
}