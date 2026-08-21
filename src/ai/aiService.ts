import Bottleneck from "bottleneck";
import { askAI } from "./askAi";
import { AIResponse } from "../types";

// ---------------- cache ----------------

const memoryCache = new Map<string, AIResponse>();
const pending = new Map<string, Promise<AIResponse | null>>();

// ---------------- limiter ----------------

const aiLimiter = new Bottleneck({
  maxConcurrent: 3,
  minTime: 200, // защита от rate limit OpenRouter
});

// ---------------- retry ----------------

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (retries <= 0) throw e;
    await sleep(300);
    return withRetry(fn, retries - 1);
  }
}

// ---------------- main API ----------------

export async function callAI(prompt: string): Promise<AIResponse | null> {
  // 1. cache hit
  const cached = memoryCache.get(prompt);
  if (cached) return cached;

  // 2. deduplicate in-flight requests
  if (pending.has(prompt)) {
    return pending.get(prompt)!;
  }

  // 3. create job
  // Никогда не реджектится — иначе одна упавшая AI-строка (сеть/ключ/лимит)
  // обрушит весь Promise.all при импорте прайса. Ошибка = null, как "нет ответа".
  const job = aiLimiter.schedule(async (): Promise<AIResponse | null> => {
    try {
      const result = await withRetry(() => askAI(prompt));

      if (!result) {
        return null;
      }

      memoryCache.set(prompt, result);
      return result;
    } catch (e) {
      console.error("AI request failed:", e);
      return null;
    }
  });

  // 4. store pending
  pending.set(prompt, job);

  try {
    return await job;
  } finally {
    pending.delete(prompt);
  }
}