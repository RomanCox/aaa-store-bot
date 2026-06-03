"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractProductAttributes = extractProductAttributes;
exports.callAIForProduct = callAIForProduct;
exports.callAIForProductMatch = callAIForProductMatch;
const aiService_1 = require("./aiService");
const productPrompt_1 = require("./prompts/productPrompt");
const category_1 = require("../utils/category");
async function extractProductAttributes(name, category) {
    const prompt = (0, productPrompt_1.buildPromptForExtractProductAttributes)(name, category);
    const response = await (0, aiService_1.callAI)(prompt);
    if (!response)
        return { attrs: null, cost: null };
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch)
        return { attrs: null, cost: response.cost };
    try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
            attrs: {
                model: parsed.model ?? "",
                connectivity: parsed.connectivity ?? "",
                chip: parsed.chip ?? "",
            },
            cost: response.cost,
        };
    }
    catch (e) {
        return { attrs: null, cost: response.cost };
    }
}
async function callAIForProduct(name, brand, category, candidates) {
    const categoryKey = (0, category_1.normalizeCategory)(category);
    // const prompt = buildProductPrompt(name, brand, categoryKey);
    const prompt = candidates
        ? (0, productPrompt_1.buildProductFromCandidatesPrompt)(name, brand, categoryKey, candidates)
        : (0, productPrompt_1.buildProductPrompt)(name, brand, category);
    const res = await (0, aiService_1.callAI)(prompt);
    if (!res) {
        console.log("CREATE EMPTY AI RESPONSE", { name, brand, categoryKey });
        return { result: { status: "error" }, cost: null, };
    }
    console.log("CREATE AI RESPONSE: ", { name, brand, categoryKey, response: res });
    // 🔧 ИЗВЛЕКАЕМ JSON
    const jsonMatch = res.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        console.log("NO JSON FOUND", { response: res });
        return { result: { status: "error" }, cost: res.cost, };
    }
    const cleaned = jsonMatch[0];
    try {
        const result = JSON.parse(cleaned);
        // Если модель не вернула поля, пробуем их извлечь (защита)
        if (!result.model)
            result.model = "";
        if (!result.name)
            result.name = "";
        if (!result.storage)
            result.storage = "";
        if (!result.color)
            result.color = "";
        // Убираем проверку low_confidence или снижаем порог
        if (result.confidence < 0.5) {
            return { result: { ...result, status: "low_confidence" }, cost: res.cost };
        }
        return { result: { ...result, status: "ok", }, cost: res.cost, };
    }
    catch (e) {
        console.log("JSON PARSE ERROR: ", {
            name,
            brand,
            category,
            response: res,
            error: e,
        });
        return { result: { status: "error" }, cost: res.cost };
    }
}
async function callAIForProductMatch(name, candidates, category) {
    const prompt = category?.toLowerCase() === "смартфоны"
        ? (0, productPrompt_1.buildMatchSmartphonePrompt)(name, candidates)
        : (0, productPrompt_1.buildMatchProductPrompt)(name, candidates);
    const res = await (0, aiService_1.callAI)(prompt);
    if (!res) {
        console.log("MATCH EMPTY AI RESPONSE", {
            name,
        });
        return {
            result: { status: "error" },
            cost: null,
        };
    }
    console.log("MATCH AI RESPONSE", {
        name,
        response: res.content,
    });
    try {
        const jsonMatch = res.content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return { result: { status: "error" }, cost: res.cost };
        }
        const result = JSON.parse(jsonMatch[0]);
        if (result.status === "matched" &&
            typeof result.confidence === "number" &&
            result.confidence < 0.6) {
            return {
                result: {
                    ...result,
                    status: "low_confidence",
                },
                cost: res.cost,
            };
        }
        return { result, cost: res.cost, };
    }
    catch (e) {
        console.log("JSON PARSE ERROR", {
            name,
            response: res,
            error: e,
        });
        return {
            result: { status: "error" },
            cost: res.cost,
        };
    }
}
