import { IChatState } from "../types";

const DEFAULT_CHAT_STATE: IChatState = { mode: "idle" };

const chatState = new Map<number, IChatState>();

export function getChatState(chatId: number): IChatState {
	if (!chatState.has(chatId)) {
		chatState.set(chatId, structuredClone(DEFAULT_CHAT_STATE));
	}
	return chatState.get(chatId)!;
}

export function setChatState(chatId: number, patch: Partial<IChatState>) {
	const current = getChatState(chatId);
	chatState.set(chatId, { ...current, ...patch });
}
