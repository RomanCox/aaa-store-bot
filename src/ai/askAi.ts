import { AIResponse } from "../types";

export async function askAI(prompt: string): Promise<AIResponse> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3.5-haiku",
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