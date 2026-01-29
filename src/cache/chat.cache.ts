export type ChatState = {
  categoriesMessageId?: number;
  productsMessageIds?: number[];
};

const chatState = new Map<number, ChatState>();

export function getChatState(chatId: number): ChatState {
  if (!chatState.has(chatId)) {
    chatState.set(chatId, {});
  }
  return chatState.get(chatId)!;
}

export function setChatState(chatId: number, state: Partial<ChatState>) {
  const current = getChatState(chatId);
  chatState.set(chatId, { ...current, ...state });
}

export function clearChatState(chatId: number) {
  chatState.delete(chatId);
}
