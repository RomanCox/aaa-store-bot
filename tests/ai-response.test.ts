import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import { askAI } from "../src/ai/askAi";
import { callAI } from "../src/ai/aiService";

afterEach(() => mock.restoreAll());

function respond(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

test("пустой ответ: диагностика лимита и reasoning, стоимость сохранена", async () => {
  mock.method(globalThis, "fetch", async () => respond({
    id: "test-request", model: "test-model", provider: "test-provider",
    choices: [{ finish_reason: "length", native_finish_reason: "max_tokens", message: { content: "", reasoning: "PRIVATE_REASONING" } }],
    usage: { cost: 0.01, prompt_tokens: 100, completion_tokens: 200, completion_tokens_details: { reasoning_tokens: 200 } },
  }));
  const warn = mock.method(console, "warn", () => {});
  assert.deepEqual(await askAI("PRIVATE_PROMPT"), { content: "", cost: 0.01 });
  const diagnostic = warn.mock.calls[0].arguments[1] as any;
  assert.equal(diagnostic.requestId, "test-request");
  assert.equal(diagnostic.finishReason, "length");
  assert.equal(diagnostic.reasoningTokens, 200);
  assert.equal(diagnostic.maxTokens, 1024);
  assert.ok(!JSON.stringify(warn.mock.calls).includes("PRIVATE_PROMPT"));
  assert.ok(!JSON.stringify(warn.mock.calls).includes("PRIVATE_REASONING"));
});

test("запрос отключает reasoning, оставляет бюджет для JSON и не задаёт temperature", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => respond({
    choices: [{ finish_reason: "stop", message: { content: '{"model":"MacBook Air 13 M5"}' } }],
  }));
  const response = await askAI("MacBook Air 13 M5 24/512 Starlight");
  const request = fetchMock.mock.calls[0].arguments[1] as RequestInit;
  const body = JSON.parse(request.body as string);
  assert.deepEqual(body.reasoning, { enabled: false });
  assert.equal(body.max_tokens, 1024);
  assert.equal(Object.prototype.hasOwnProperty.call(body, "temperature"), false);
  assert.deepEqual(body.response_format, { type: "json_object" });
  assert.equal(JSON.parse(response.content).model, "MacBook Air 13 M5");
});

test("ошибка внутри HTTP 200 видна, ключи скрыты", async () => {
  mock.method(globalThis, "fetch", async () => respond({
    error: { code: 502, message: "provider failed: Bearer test-secret sk-test-secret" },
  }));
  const warn = mock.method(console, "warn", () => {});
  await askAI("test");
  const diagnostic = warn.mock.calls[0].arguments[1] as any;
  assert.equal(diagnostic.errorCode, "502");
  assert.match(diagnostic.errorMessage, /provider failed/);
  assert.ok(!diagnostic.errorMessage.includes("test-secret"));
});

test("null content и отказ диагностируются без текста отказа", async () => {
  mock.method(globalThis, "fetch", async () => respond({
    choices: [{ finish_reason: "stop", message: { content: null, refusal: "PRIVATE_REFUSAL" } }],
  }));
  const warn = mock.method(console, "warn", () => {});
  assert.equal((await askAI("test")).content, "");
  const diagnostic = warn.mock.calls[0].arguments[1] as any;
  assert.equal(diagnostic.refusalPresent, true);
  assert.equal(diagnostic.contentType, "null");
  assert.ok(!JSON.stringify(warn.mock.calls).includes("PRIVATE_REFUSAL"));
});

test("пустой ответ не кешируется и не вызывает автоматический повтор", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => respond({
    choices: [{ message: { content: "  " } }], usage: { cost: 0.02 },
  }));
  mock.method(console, "warn", () => {});
  assert.equal((await callAI("empty-cache-test"))?.cost, 0.02);
  assert.equal(fetchMock.mock.callCount(), 1);
  await callAI("empty-cache-test");
  assert.equal(fetchMock.mock.callCount(), 2);
});

test("непустой ответ по-прежнему кешируется без диагностического предупреждения", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => respond({
    choices: [{ finish_reason: "stop", message: { content: '{"status":"ok"}' } }],
  }));
  const warn = mock.method(console, "warn", () => {});
  await callAI("success-cache-test");
  await callAI("success-cache-test");
  assert.equal(fetchMock.mock.callCount(), 1);
  assert.equal(warn.mock.callCount(), 0);
});
