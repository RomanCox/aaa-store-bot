import { ChatState, SECTION, SectionStateMap } from "../types";

const DEFAULT_CHAT_STATE: ChatState = {
  section: SECTION.HOME,
  mode: "idle",
  activeMessageId: undefined,
  sections: {
    [SECTION.HOME]: {
      messageId: undefined,
    },
    [SECTION.CART]: {
      messageId: undefined,
      flowStep: "main",
      currentOrder: [],
    },
    [SECTION.CATALOG]: {
      messageId: undefined,
      flowStep: "brands",
      lastProductGroups: [],
    },
    [SECTION.ORDERS]: {
      messageId: undefined,
      flowStep: "main",
      page: 1,
      totalPages: 1,
      selectedUserId: undefined,
    },
    [SECTION.ADMIN_PANEL]: {
      messageId: undefined,
      flowStep: "main",
      users: {
        page: 1,
        totalPages: 1,
        editingUserId: undefined,
        newUserId: undefined,
      },
    },
  },
};

const chatState = new Map<number, ChatState>();

export function getChatState(chatId: number): ChatState {
	if (!chatState.has(chatId)) {
		chatState.set(chatId, structuredClone(DEFAULT_CHAT_STATE));
	}
	return chatState.get(chatId)!;
}

export function getSectionState<T extends SECTION>(
  state: ChatState,
  section: T
): ChatState["sections"][T] | undefined {
  return state.sections?.[section];
}

export function setChatState(chatId: number, patch: Partial<ChatState>) {
	const current = getChatState(chatId);
	chatState.set(chatId, { ...current, ...patch });
}

export function updateSectionState<K extends SECTION>(
  chatId: number,
  section: K,
  updater: (prev: SectionStateMap[K]) => SectionStateMap[K],
) {
  const state = getChatState(chatId);
  const prevSectionState = state.sections[section] as SectionStateMap[K];

  const updatedSectionState = updater(prevSectionState);

  setChatState(chatId, {
    sections: {
      ...state.sections,
      [section]: updatedSectionState,
    },
  });
}