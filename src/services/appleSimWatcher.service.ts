import fs from "fs";
import cron from "node-cron";
import TelegramBot from "node-telegram-bot-api";
import { APPLE_SIM_PAGE_PATH } from "../constants";
import { ADMIN_TEXTS } from "../texts";

// Следим за страницей Apple со списком типов SIM по моделям iPhone/iPad:
// когда она меняется (например, вышла новая модель), пишем админу, что добавилось/удалилось —
// по этим данным правятся normalizeSimByRules и *_SIM_ONLY_COUNTRIES / *_ESIM_ONLY_COUNTRIES.
const APPLE_SIM_PAGE_URL = "https://support.apple.com/ru-ru/118569";
const CHECK_SCHEDULE = "0 10 * * *";
const TIMEZONE = "Europe/Minsk";
const ADMIN_ID = Number(process.env.ADMIN_ID);
const TELEGRAM_MESSAGE_LIMIT = 4000;

// Границы блока со списками моделей — всё вне его (меню, футер, отзывы) в сравнении не участвует.
const CONTENT_START_MARKER = "Узнайте, SIM-карта какого типа";
const CONTENT_END_MARKER = "Дополнительная информация";
const PUBLISHED_MARKER = "Дата публикации:";

type SavedPage = {
	published?: string;
	lines: string[];
	checkedAt: string;
	parseErrorNotified?: boolean;
};

type ParsedPage = {
	published?: string;
	lines: string[];
};

function decodeEntities(text: string): string {
	return text
		.replace(/&nbsp;/g, " ")
		.replace(/&quot;/g, "\"")
		.replace(/&#39;|&apos;/g, "'")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
		.replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
		.replace(/&amp;/g, "&");
}

function htmlToLines(html: string): string[] {
	const text = html
		.replace(/<script[\s\S]*?<\/script>/gi, "")
		.replace(/<style[\s\S]*?<\/style>/gi, "")
		.replace(/<[^>]+>/g, "\n");

	return decodeEntities(text)
		.split("\n")
		.map(line => line.replace(/\s+/g, " ").trim())
		.filter(Boolean);
}

export function parseAppleSimPage(html: string): ParsedPage | undefined {
	const allLines = htmlToLines(html);

	const start = allLines.findIndex(line => line.includes(CONTENT_START_MARKER));
	const end = allLines.findIndex((line, i) => i > start && line.includes(CONTENT_END_MARKER));
	if (start === -1 || end === -1) {
		return undefined;
	}

	const lines = allLines.slice(start + 1, end);
	if (!lines.some(line => line.includes("iPhone"))) {
		return undefined;
	}

	const publishedIndex = allLines.findIndex(line => line.includes(PUBLISHED_MARKER));
	const published = publishedIndex === -1 ? undefined : allLines[publishedIndex + 1];

	return { published, lines };
}

function loadSavedPage(): SavedPage | undefined {
	if (!fs.existsSync(APPLE_SIM_PAGE_PATH)) {
		return undefined;
	}

	try {
		const parsed = JSON.parse(fs.readFileSync(APPLE_SIM_PAGE_PATH, "utf8"));
		return Array.isArray(parsed?.lines) ? parsed : undefined;
	} catch (e) {
		console.error("❌ Ошибка чтения apple-sim-page.json:", e);
		return undefined;
	}
}

function savePage(page: SavedPage) {
	fs.writeFileSync(APPLE_SIM_PAGE_PATH, JSON.stringify(page, null, 2), "utf8");
}

function buildChangeMessage(prev: SavedPage, next: ParsedPage): string | undefined {
	const prevSet = new Set(prev.lines);
	const nextSet = new Set(next.lines);
	const added = next.lines.filter(line => !prevSet.has(line));
	const removed = prev.lines.filter(line => !nextSet.has(line));

	if (!added.length && !removed.length) {
		return undefined;
	}

	let message = `${ADMIN_TEXTS.APPLE_SIM_PAGE_CHANGED}`;
	if (next.published) {
		message += ` (${next.published})`;
	}
	message += `\n${APPLE_SIM_PAGE_URL}\n\n`;

	if (added.length) {
		message += `${ADMIN_TEXTS.APPLE_SIM_PAGE_ADDED}\n${added.map(line => `• ${line}`).join("\n")}\n\n`;
	}
	if (removed.length) {
		message += `${ADMIN_TEXTS.APPLE_SIM_PAGE_REMOVED}\n${removed.map(line => `• ${line}`).join("\n")}\n\n`;
	}
	message += ADMIN_TEXTS.APPLE_SIM_PAGE_HINT;

	return message.length > TELEGRAM_MESSAGE_LIMIT
		? message.slice(0, TELEGRAM_MESSAGE_LIMIT) + "…"
		: message;
}

export async function checkAppleSimPage(bot: TelegramBot) {
	if (!ADMIN_ID) return;

	let html: string;
	try {
		const response = await fetch(APPLE_SIM_PAGE_URL, {
			headers: { "User-Agent": "Mozilla/5.0" },
			signal: AbortSignal.timeout(30_000),
		});
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		html = await response.text();
	} catch (e) {
		// Сетевые сбои админу не шлём — завтра проверка повторится.
		console.error("❌ Не удалось загрузить страницу Apple про SIM:", e);
		return;
	}

	const saved = loadSavedPage();
	const parsed = parseAppleSimPage(html);

	if (!parsed) {
		// Сообщаем о поломке разбора один раз, а не каждый день.
		if (!saved?.parseErrorNotified) {
			await bot.sendMessage(ADMIN_ID, `${ADMIN_TEXTS.APPLE_SIM_PAGE_PARSE_ERROR}\n${APPLE_SIM_PAGE_URL}`);
			savePage({
				...(saved ?? { lines: [] }),
				checkedAt: new Date().toISOString(),
				parseErrorNotified: true,
			});
		}
		return;
	}

	// Первый запуск (или после сбоя разбора без сохранённой версии) — просто запоминаем текущую версию.
	if (saved?.lines.length) {
		const message = buildChangeMessage(saved, parsed);
		if (message) {
			await bot.sendMessage(ADMIN_ID, message, { disable_web_page_preview: true });
		}
	}

	savePage({
		published: parsed.published,
		lines: parsed.lines,
		checkedAt: new Date().toISOString(),
	});
}

export function startAppleSimWatcher(bot: TelegramBot) {
	checkAppleSimPage(bot).catch(console.error);

	cron.schedule(CHECK_SCHEDULE, () => {
		checkAppleSimPage(bot).catch(console.error);
	}, { timezone: TIMEZONE });
}
