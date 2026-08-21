import crypto from 'crypto';
import { setCallbackHash } from "../services/callbackHashMap";

// Telegram отклоняет callback_data длиннее 64 байт.
const TELEGRAM_CALLBACK_DATA_LIMIT = 64;

function hashString(str: string) {
	return crypto.createHash('md5').update(str).digest('hex');
}

export function buildCallbackData(...parts: string[]): string {
	const raw = parts.filter(Boolean).join('::');

	// Короткие payload шлём как есть, без хэша: не растим callbackHashMap попусту
	// (она живёт только в памяти и не переживает рестарт бота — захэшированная
	// кнопка после рестарта молча перестаёт работать, см. parseCallbackData).
	// Хэшируем только то, что реально не влезает в лимит Telegram.
	if (Buffer.byteLength(raw, 'utf8') <= TELEGRAM_CALLBACK_DATA_LIMIT) {
		return raw;
	}

	const hash = hashString(raw);
	setCallbackHash(hash, raw);
	return hash;
}
