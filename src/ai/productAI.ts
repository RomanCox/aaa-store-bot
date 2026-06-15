import { callAI } from "./aiService";
import {
  buildMatchSmartphonePrompt, buildProductFromCandidatesPrompt, buildProductPrompt,
  buildPromptForExtractModel, buildPromptForExtractProductAttributes
} from "./prompts/productPrompt";
import { normalizeCategory } from "../utils/category";
import { AiCandidate, ExtractedAttrs, MatchResult, ProductCreationResult } from "../types";

export async function extractProductAttributes(name: string, category: string): Promise<{ attrs: ExtractedAttrs | null; cost: number | null }> {
  const prompt = buildPromptForExtractProductAttributes(name, category);

  const response = await callAI(prompt);
  if (!response) return { attrs: null, cost: null };

  const jsonMatch = response.content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { attrs: null, cost: response.cost };
  
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
  } catch (e) {
    return { attrs: null, cost: response.cost };
  }
}

export async function extractModelOnly(
  name: string,
  existingModels: string[]
): Promise<{ model: string | null; cost: number | null }> {
  const prompt = buildPromptForExtractModel(name, existingModels);
  const response = await callAI(prompt);
  if (!response) return { model: null, cost: null };

  const jsonMatch = response.content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { model: null, cost: response.cost };

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const model = parsed.model && typeof parsed.model === 'string' ? parsed.model.trim() : null;
    return { model, cost: response.cost };
  } catch (e) {
    return { model: null, cost: response.cost };
  }
}

export async function callAIForProduct(
  name: string,
  brand: string,
  category: string,
  candidates?: AiCandidate[],
): Promise<{ result: ProductCreationResult, cost: number | null, }> {
  const categoryKey = normalizeCategory(category);

  // const prompt = buildProductPrompt(name, brand, categoryKey);
  const prompt = candidates
    ? buildProductFromCandidatesPrompt(name, brand, categoryKey, candidates)
    : buildProductPrompt(name, brand, category);

  const res = await callAI(prompt);

  if (!res) {
    console.log("CREATE EMPTY AI RESPONSE", { name, brand, categoryKey })
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
    if (!result.model) result.model = "";
    if (!result.name) result.name = "";
    if (!result.storage) result.storage = "";
    if (!result.color) result.color = "";

    // Убираем проверку low_confidence или снижаем порог
    if (result.confidence < 0.5) {
      return { result: { ...result, status: "low_confidence" }, cost: res.cost };
    }
    return { result: { ...result, status: "ok", }, cost: res.cost, };
  } catch (e) {
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

export async function callAIForProductMatch(
  name: string,
  candidates: AiCandidate[],
  category?: string,
): Promise<{ result: MatchResult; cost: number | null }> {
  // const prompt =
    // category?.toLowerCase() === "смартфоны"
      // ? buildMatchSmartphonePrompt(name, candidates)
      // : buildMatchProductPrompt(name, candidates);
  const prompt = buildMatchSmartphonePrompt(name, candidates);

  const res = await callAI(prompt);

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

    if (
      result.status === "matched" &&
      typeof result.confidence === "number" &&
      result.confidence < 0.6
    ) {
      return {
        result: {
          ...result,
          status: "low_confidence",
        },
        cost: res.cost,
      };
    }

    return { result, cost: res.cost, };
  } catch (e) {
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

