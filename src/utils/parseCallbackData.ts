interface ParsedCallback {
	action: string;
	section?: string;
	params: string[];
}

export function parseCallbackData(data: string): ParsedCallback {
	const [action, section, ...params] = data.split(":");

	return {
		action,
		section,
		params,
	};
}