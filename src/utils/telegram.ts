const TELEGRAM_MESSAGE_LIMIT = 4096;

export function splitMessage(text: string, limit = TELEGRAM_MESSAGE_LIMIT): string[] {
	const parts: string[] = [];
	let current = "";

	for (const line of text.split("\n")) {
		if ((current + "\n" + line).length > limit) {
			parts.push(current);
			current = line;
		} else {
			current += (current ? "\n" : "") + line;
		}
	}

	if (current) parts.push(current);

	return parts;
}
