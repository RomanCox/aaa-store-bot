import { getCallbackOriginal } from "../services/callbackHashMap";

interface ParsedCallback {
	action: string;
	params: string[];
}

export function parseCallbackData(data: string): ParsedCallback | null {
	const original = getCallbackOriginal(data);

	const source = original ?? data;

	const [action, ...params] = source.split("::");

	return {
		action,
		params,
	};
}