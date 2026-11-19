import { AIResponse } from "../types";

const AI_REQUEST_TIMEOUT_MS = 30_000;
const AI_MAX_TOKENS = 1024;

// Только диагностические поля: без prompt, заголовков авторизации и reasoning.
function diagnosticText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  let text = value;
  const key = process.env.OPENROUTER_API_KEY;
  if (key) text = text.split(key).join("[REDACTED]");
  return text.replace(/Bearer\s+\S+|sk-[\w-]+/gi, "[REDACTED]").slice(0, 500);
}

export async function askAI(prompt: string): Promise<AIResponse> {
  const model = process.env.OPENROUTER_MODEL || '~anthropic/claude-haiku-latest';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: AI_MAX_TOKENS,
        // Извлекаем короткий JSON, без затрат общего бюджета на thinking.
        // temperature не передаём: Haiku 5.5 не поддерживает значение 0.
        reasoning: { enabled: false },
        response_format: {
          type: "json_object",
        },
        messages: [
          {
            role: "system",
            content: "You are a JSON-only assistant. Your response must contain exactly one JSON object and nothing else. No markdown, no code blocks, no explanations."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const data = await res.json();

  // Стоимость из заголовка
  const costHeader = parseFloat(res.headers.get('x-openrouter-cost') || '0');
  // Стоимость из тела (если есть)
  const bodyCost = data?.usage?.cost ?? 0;
  const cost = costHeader || bodyCost;

  const choice = data?.choices?.[0];
  const rawContent = choice?.message?.content;
  const content = typeof rawContent === "string" ? rawContent : "";

  if (!content.trim() || data?.error || choice?.error || choice?.finish_reason === "length") {
    const error = data?.error || choice?.error;
    console.warn("AI_RESPONSE_DIAGNOSTICS", {
      httpStatus: res.status,
      requestId: diagnosticText(data?.id),
      requestedModel: model,
      responseModel: diagnosticText(data?.model),
      provider: diagnosticText(data?.provider),
      maxTokens: AI_MAX_TOKENS,
      finishReason: diagnosticText(choice?.finish_reason),
      nativeFinishReason: diagnosticText(choice?.native_finish_reason),
      contentType: rawContent === null ? "null" : typeof rawContent,
      contentLength: content.length,
      refusalPresent: Boolean(choice?.message?.refusal),
      errorCode: diagnosticText(String(error?.code ?? "")),
      errorMessage: diagnosticText(error?.message),
      promptTokens: data?.usage?.prompt_tokens,
      completionTokens: data?.usage?.completion_tokens,
      reasoningTokens: data?.usage?.completion_tokens_details?.reasoning_tokens,
      cost,
    });
  }

  return { content, cost };
}
