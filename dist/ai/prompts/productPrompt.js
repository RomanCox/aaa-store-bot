"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPromptForExtractProductAttributes = buildPromptForExtractProductAttributes;
exports.buildProductFromCandidatesPrompt = buildProductFromCandidatesPrompt;
exports.buildProductPrompt = buildProductPrompt;
exports.buildMatchProductPrompt = buildMatchProductPrompt;
function buildPromptForExtractProductAttributes(name, category) {
    let chipInstruction = "";
    if (category === "laptop" || category === "computer") {
        chipInstruction = "Extract chip as M-series with Pro/Max if present (e.g., M4, M4 Pro, M4 Max, M5 Pro).";
    }
    else {
        chipInstruction = "Extract chip only if it's a processor (e.g., A15, A17). Ignore 'Pro'/'Max' as they refer to model, not chip.";
    }
    return `Return ONLY JSON. Extract from product name: model, storage (as number, without GB/TB or RAM/SSD format like "16/512"), color, connectivity (WiFi/LTE/Cellular), ${chipInstruction}. Use empty string if missing.

Input: ${name}
Output: {"model":"iPad Air 13","storage":"1024","color":"Blue","connectivity":"LTE","chip":"M2"}
`;
}
;
function buildProductFromCandidatesPrompt(name, brand, category, candidates) {
    return `Return ONLY JSON. No text, no markdown.

Pick the most similar candidate. Copy its model and base name.
Adjust storage, color and displayFinish ONLY if incoming name explicitly specifies them.
Normalize: "128GB" → "128", "1TB" → "1024", "Cloud White" → "White".
For displayFinish: if incoming name contains "Nano Texture", set displayFinish="Nano Texture", else empty string.
Ignore SIM, country, activation.

COLOR IS CRITICAL: products with different colors (after synonym mapping) are different.
DISPLAY FINISH IS CRITICAL: "Nano Texture" vs empty string are different.

For category "smartwatch":
- Remove strap/band color and material (e.g., "Black Sport Band", "Blue Leather").
- Keep only case color, case material (if present), and size.
- Output storage as just number (no "GB"/"TB").

Output format: {"status":"ok","confidence":0.95,"model":"...","name":"...","storage":"...","color":"..."}

Incoming: ${name}
Brand: ${brand}
Category: ${category}
Candidates: ${JSON.stringify(candidates.slice(0, 3), null, 2)}`;
}
function buildProductPrompt(name, brand, category) {
    return `Return ONLY JSON. No text, no markdown.

Extract product model and clean name from incoming text.
- Ignore: color, storage, SIM, country, activation (we add them later).
- Model: base product line (e.g., "iPhone 15", "MacBook Air"). Do NOT include storage, color, SIM, country.
- Name: keep storage and color as written, but remove flags, SIM, activation.

Output: {"status":"ok","confidence":0.9,"model":"iPhone 15","name":"iPhone 15 256GB Blue"}

Input: brand=${brand}, category=${category}, raw_name=${name}`;
}
function buildMatchProductPrompt(incomingName, candidates) {
    return `Return ONLY JSON. No text, no markdown, no explanations.

Match based on model, storage, modifiers (Pro, Max, Plus, SE, ANC), and color.
Display finish (Nano Texture) is also critical.
SIM, country, activation are already filtered – ignore them.

Order of number and modifier does not matter: "Pro 4" = "4 Pro".
Different if modifier differs: "AirPods 4" vs "AirPods 4 ANC" → different.
Different if model generation differs: "iPhone 15" vs "iPhone 15 Pro" → different.
Different if display finish differs: "iPad Pro (Nano Texture)" vs "iPad Pro" → different.
Different if color differs: "Space Black" vs "Silver" → different.

Output: {"status":"matched","productId":"...","confidence":0.95} or {"status":"no_match","productId":"","confidence":0.0}

Incoming: ${incomingName}
Candidates: ${JSON.stringify(candidates, null, 2)}`;
}
