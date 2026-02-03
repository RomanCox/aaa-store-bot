type CallbackPart = string | number | undefined | null;

//Params: action, section, params

export function buildCallbackData(...parts: CallbackPart[]): string {
	return parts
		.filter((p): p is string | number => p !== undefined && p !== null)
		.map(String)
		.join(":");
}