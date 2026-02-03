import { ChatState } from "../types/chat";

const DEFAULT_CHAT_STATE: ChatState = {};

const chatState = new Map<number, ChatState>();

export function getChatState(chatId: number): ChatState {
	if (!chatState.has(chatId)) {
		chatState.set(chatId, structuredClone(DEFAULT_CHAT_STATE));
	}
	return chatState.get(chatId)!;
}

export function setChatState(chatId: number, patch: Partial<ChatState>) {
	const current = getChatState(chatId);
	chatState.set(chatId, { ...current, ...patch });
}

export function resetChatState(chatId: number) {
	chatState.delete(chatId);
}

// export function resetSectionState(chatId: number, section: Section) {
// 	const current = getChatState(chatId);
//
// 	switch (section) {
// 		case "catalog":
// 			setChatState(chatId, {
// 				section: section,
// 				catalogStep: "brands",
// 				selectedBrand: undefined,
// 				selectedCategory: undefined,
// 				productsMessageIds: [],
// 			});
// 			break;
//
// 		case "admin":
// 			setChatState(chatId, {
// 				section: Section.Admin,
// 				adminStep: "main",
// 			});
// 			break;
//
// 		case "cart":
// 			setChatState(chatId, {
// 				section: Section.Cart,
// 				cartStep: "root",
// 				selectedBrand: undefined,
// 				selectedCategory: undefined,
// 				selectedProductId: undefined,
// 				selectedVariantId: undefined,
// 			});
// 			break;
// 	}
// }

export function clearChatState(chatId: number) {
	chatState.delete(chatId);
}
