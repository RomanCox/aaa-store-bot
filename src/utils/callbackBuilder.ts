import crypto from 'crypto';
import { setCallbackHash } from "../services/callbackHashMap";

function hashString(str: string) {
	return crypto.createHash('md5').update(str).digest('hex');
}

export function buildCallbackData(...parts: string[]): string {
	const raw = parts.filter(Boolean).join('::');
	const hash = hashString(raw);
	setCallbackHash(hash, raw);
	return hash;
}
