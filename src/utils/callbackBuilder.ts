import crypto from 'crypto';
import { setCallbackHash } from "../services/callbackHashMap";

// type CallbackPart = string | number | undefined | null;

function hashString(str: string) {
	return crypto.createHash('md5').update(str).digest('hex');
}

export function buildCallbackData(...parts: string[]): string {
	const raw = parts.filter(Boolean).join('::');
	const hash = hashString(raw);
	setCallbackHash(hash, raw);
	return hash;
}

// export function buildCallbackData(...parts: CallbackPart[]): string {
// 	return parts
// 		.filter((p): p is string | number => p !== undefined && p !== null)
// 		.map(String)
// 		.join("::");
// }