import assert from "node:assert/strict";
import { beforeEach, afterEach, mock, test } from "node:test";
import type { UserRole } from "../src/types";

// Без .env, bootstrap, рабочих данных и внешних запросов.
for (const key of ["RETAIL_MANAGER_URL", "WHOLESALE_MANAGER_URL", "GOOGLE_APPLICATION_CREDENTIALS", "SPREADSHEET_CONFIG_ID", "SPREADSHEET_WAREHOUSE_ID"]) {
  process.env[key] = "helper-test-only";
}
const { google } = require("googleapis");
const googleMock = mock.method(google, "sheets", () => ({ spreadsheets: { values: {
  get: async () => { throw new Error("Google forbidden"); },
} } }));
const { registerCallbacks } = require("../src/handlers/callback.handler") as typeof import("../src/handlers/callback.handler");
googleMock.mock.restore();
const { showAdminHelper, sendHelperTopic } = require("../src/services/helper.service") as typeof import("../src/services/helper.service");
const { getChatState, setChatState } = require("../src/state/chat.state") as typeof import("../src/state/chat.state");
const { HELPER_TOPICS, HELPER_TEXTS, HELPER_LINKS, ADMIN_TEXTS, USERS_ERRORS } = require("../src/texts") as typeof import("../src/texts");
const { SECTION, CALLBACK_TYPE } = require("../src/types") as typeof import("../src/types");
const { helperKeyboard, adminKeyboard } = require("../src/keyboards") as typeof import("../src/keyboards");
const { TELEGRAM_MESSAGE_LIMIT } = require("../src/constants") as typeof import("../src/constants");
const users = require("../src/services/users.service") as typeof import("../src/services/users.service");
const fs = require("node:fs") as typeof import("node:fs");
const { renderSection } = require("../src/render/renderSection") as typeof import("../src/render/renderSection");
const chatId = 778;
let role: UserRole | undefined;
let sends: { text: string; options: any; id: number }[];
let edits: { text: string; options: any }[];
let markups: { markup: any; options: any }[];
let callbacks: Record<string, (query: any) => Promise<void>>;
let bot: any;

beforeEach(() => {
  role = "admin";
  sends = []; edits = []; markups = []; callbacks = {};
  mock.method(users, "isAdmin", () => role === "admin" || role === "superadmin");
  mock.method(globalThis, "fetch", async () => { throw new Error("Network forbidden"); });
  mock.method(fs, "writeFileSync", () => { throw new Error("Filesystem writes forbidden"); });
  bot = {
    on: (event: string, fn: any) => { callbacks[event] = fn; },
    answerCallbackQuery: async () => {},
    sendMessage: async (_id: number, text: string, options: any) => {
      const id = 101 + sends.length;
      sends.push({ text, options, id });
      return { message_id: id };
    },
    editMessageText: async (text: string, options: any) => { edits.push({ text, options }); },
    editMessageReplyMarkup: async (markup: any, options: any) => { markups.push({ markup, options }); },
    deleteMessage: async () => { throw new Error("Deleting helper messages forbidden"); },
  };
  setChatState(chatId, {
    section: SECTION.ADMIN_PANEL, mode: "add_user", activeMessageId: 42,
    sections: {
      [SECTION.ADMIN_PANEL]: { flowStep: "add_user", messageId: 42, users: { newUserId: 123, editingUserId: 456 } },
      [SECTION.CART]: { flowStep: "main", currentOrder: [] },
    },
  });
  registerCallbacks(bot);
});
afterEach(() => mock.restoreAll());

function click(action: string) {
  return callbacks.callback_query({ id: "q", data: action, from: { id: chatId }, message: { chat: { id: chatId }, message_id: 1 } });
}

test("helper is last panel action; menu has three topics and protected back", () => {
  assert.deepEqual(adminKeyboard().slice(-1)[0], [{ text: HELPER_TEXTS.BUTTON, callback_data: CALLBACK_TYPE.ADMIN_HELPER }]);
  assert.equal(helperKeyboard().length, 4);
  assert.deepEqual(helperKeyboard().slice(0, 3).map(row => row[0].text), HELPER_TOPICS.map(t => t.label));
  assert.equal(helperKeyboard()[3][0].callback_data, CALLBACK_TYPE.HELPER_BACK);
});

test("opening edits active panel, clears pending input and preserves cart", async () => {
  const cart = getChatState(chatId).sections[SECTION.CART];
  await click(CALLBACK_TYPE.ADMIN_HELPER);
  assert.equal(sends.length, 0);
  assert.equal(edits[0].text, HELPER_TEXTS.MENU);
  assert.equal(edits[0].options.message_id, 42);
  assert.deepEqual(edits[0].options.reply_markup.inline_keyboard, helperKeyboard());
  assert.equal(getChatState(chatId).mode, "idle");
  assert.equal(getChatState(chatId).sections[SECTION.ADMIN_PANEL]?.users.newUserId, undefined);
  assert.equal(getChatState(chatId).sections[SECTION.ADMIN_PANEL]?.users.editingUserId, undefined);
  assert.equal(getChatState(chatId).sections[SECTION.CART], cart);
});

for (const topic of HELPER_TOPICS) test(`topic ${topic.id}: separate ordered parts, last keyboard and edit on back`, async () => {
  await click(`${CALLBACK_TYPE.HELPER_TOPIC}::${topic.id}`);
  assert.deepEqual(sends.map(item => item.text), topic.messages);
  assert.equal(sends.length, { users: 3, config: 4, warehouse: 1 }[topic.id]);
  const last = sends[sends.length - 1];
  assert.ok(sends.slice(0, -1).every(item => item.options.reply_markup === undefined));
  assert.deepEqual(last.options.reply_markup.inline_keyboard, helperKeyboard());
  assert.equal(getChatState(chatId).activeMessageId, last.id);
  assert.equal(getChatState(chatId).sections[SECTION.ADMIN_PANEL]?.messageId, last.id);
  assert.equal(edits.length, 0);
  assert.deepEqual(markups[0].markup, { inline_keyboard: [] });
  await click(CALLBACK_TYPE.HELPER_BACK);
  assert.equal(edits[0].text, ADMIN_TEXTS.ADMIN_PANEL_TITLE);
  assert.equal(edits[0].options.message_id, last.id);
  assert.equal(sends.length, topic.messages.length);
  assert.equal(getChatState(chatId).sections[SECTION.ADMIN_PANEL]?.flowStep, "main");
});

for (const allowed of ["admin", "superadmin"] as const) test(`all helper callbacks allowed for ${allowed}`, async () => {
  role = allowed;
  await click(CALLBACK_TYPE.ADMIN_HELPER);
  await click(`${CALLBACK_TYPE.HELPER_TOPIC}::warehouse`);
  await click(CALLBACK_TYPE.HELPER_BACK);
  assert.equal(sends.length, 1);
  assert.equal(edits.length, 2);
});

for (const denied of ["retail", "wholesale", "manager_retail", "manager_wholesale", undefined] as const) test(`forged helper callbacks blocked for ${denied}`, async () => {
  role = denied;
  for (const action of [CALLBACK_TYPE.ADMIN_HELPER, `${CALLBACK_TYPE.HELPER_TOPIC}::users`, CALLBACK_TYPE.HELPER_BACK]) await click(action);
  assert.equal(sends.length, 0);
  assert.equal(edits.length, 3);
  assert.ok(edits.every(item => item.text === USERS_ERRORS.ONLY_ADMIN));
  assert.equal(markups.length, 0);
  await showAdminHelper(bot, chatId);
  await sendHelperTopic(bot, chatId, "users");
  assert.equal(edits.length, 3);
});

test("unknown topic does not change screen or state", async () => {
  const state = structuredClone(getChatState(chatId));
  await click(`${CALLBACK_TYPE.HELPER_TOPIC}::invalid`);
  assert.equal(sends.length + edits.length + markups.length, 0);
  assert.deepEqual(getChatState(chatId), state);
});

test("fresh screen is sent once, subsequent menu is edited", async () => {
  setChatState(chatId, { activeMessageId: undefined });
  await showAdminHelper(bot, chatId);
  await showAdminHelper(bot, chatId);
  assert.equal(sends.length, 1);
  assert.equal(edits.length, 1);
  assert.equal(edits[0].options.message_id, sends[0].id);
});

test("rapid choices are serialized, including return", async () => {
  await Promise.all([sendHelperTopic(bot, chatId, "users"), sendHelperTopic(bot, chatId, "config"), showAdminHelper(bot, chatId, true)]);
  assert.deepEqual(sends.map(item => item.text), [...HELPER_TOPICS[0].messages, ...HELPER_TOPICS[1].messages]);
  assert.equal(edits[0].options.message_id, sends[sends.length - 1].id);
  assert.equal(getChatState(chatId).sections[SECTION.ADMIN_PANEL]?.flowStep, "main");
});

test("partial send failure retains navigation and allows retry", async () => {
  const original = bot.sendMessage;
  let count = 0;
  bot.sendMessage = async (...args: any[]) => {
    if (++count === 2) throw new Error("Telegram unavailable");
    return original(...args);
  };
  await assert.rejects(sendHelperTopic(bot, chatId, "users"), /Telegram unavailable/);
  assert.equal(getChatState(chatId).activeMessageId, sends[0].id);
  assert.deepEqual(markups[markups.length - 1].markup.inline_keyboard, helperKeyboard());
  assert.equal(markups[markups.length - 1].options.message_id, sends[0].id);
  bot.sendMessage = original;
  await sendHelperTopic(bot, chatId, "warehouse");
  assert.equal(sends.length, 2);
});

test("callback reports send error without rejecting or losing previous parts", async () => {
  const original = bot.sendMessage;
  let count = 0;
  bot.sendMessage = async (...args: any[]) => {
    if (++count === 2) throw new Error("Telegram unavailable");
    return original(...args);
  };
  await click(`${CALLBACK_TYPE.HELPER_TOPIC}::users`);
  assert.deepEqual(sends.map(item => item.text), [HELPER_TOPICS[0].messages[0], HELPER_TEXTS.SEND_ERROR]);
  assert.deepEqual(markups[markups.length - 1].markup.inline_keyboard, helperKeyboard());
});

test("existing section renderer and generic back retain helper navigation", async () => {
  await showAdminHelper(bot, chatId);
  await renderSection(bot, chatId);
  await click(CALLBACK_TYPE.BACK);
  assert.equal(sends.length, 0);
  assert.equal(edits[1].text, HELPER_TEXTS.MENU);
  assert.equal(edits[2].text, ADMIN_TEXTS.ADMIN_PANEL_TITLE);
  assert.ok(edits.every(edit => edit.options.message_id === 42));
});

test("queued action rechecks role after access is revoked", async () => {
  const original = bot.sendMessage;
  bot.sendMessage = async (...args: any[]) => {
    const result = await original(...args);
    role = "retail";
    return result;
  };
  await Promise.all([sendHelperTopic(bot, chatId, "warehouse"), sendHelperTopic(bot, chatId, "users")]);
  assert.equal(sends.length, 1);
});

test("messages fit Telegram limit with balanced HTML and correct links", () => {
  for (const topic of HELPER_TOPICS) for (const text of topic.messages) {
    assert.ok(text.length <= TELEGRAM_MESSAGE_LIMIT, `${topic.id}: ${text.length}`);
    const stack: string[] = [];
    for (const tag of text.matchAll(/<(\/?)(b|code|a)(?: href="[^"]*")?>/g)) {
      if (tag[1]) assert.equal(stack.pop(), tag[2]);
      else stack.push(tag[2]);
    }
    assert.equal(stack.length, 0);
    assert.ok(!text.replace(/<\/?(?:b|code|a)(?: href="[^"]*")?>/g, "").includes("<"));
  }
  assert.ok(HELPER_TOPICS[1].messages[0].includes(HELPER_LINKS.CONFIG));
  assert.ok(HELPER_TOPICS[2].messages[0].includes(HELPER_LINKS.WAREHOUSE));
});

test("delete and edit instructions obtain ID from the person's profile", () => {
  const instructions = HELPER_TOPICS.find(topic => topic.id === "users")!.messages.slice(1);
  for (const text of instructions) {
    const firstStep = text.split("\n").find(line => line.startsWith("<b>1.</b>"));
    assert.ok(firstStep);
    assert.match(firstStep, /профил/i);
    assert.match(firstStep, /ID/);
    assert.doesNotMatch(firstStep, /спис[ок]/i);
    assert.match(text, /только цифры/);
  }
});
