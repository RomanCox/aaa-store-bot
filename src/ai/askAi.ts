import { AIResponse } from "../types";

const AI_REQUEST_TIMEOUT_MS = 30_000;

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
        temperature: 0,
        max_tokens: 200,
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

  const content = data?.choices?.[0]?.message?.content || "";

  return { content, cost };
}