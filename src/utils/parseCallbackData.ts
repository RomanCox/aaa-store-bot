import { getCallbackOriginal } from "../services/callbackHashMap";

interface ParsedCallback {
	action: string;
	params: string[];
}

export function parseCallbackData(data: string): ParsedCallback | null {
	const original = getCallbackOriginal(data);
	if (!original) return null;

	const [action, ...params] = original.split("::");

	return {
		action,
		params,
	};
}