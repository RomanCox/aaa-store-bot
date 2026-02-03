import { UserMode, UserRole, UserState } from "../types/user";

const userStates = new Map<number, UserState>();

const DEFAULT_STATE: UserState = {
	mode: "idle",
};

export function getUserState(userId: number): UserState {
	return userStates.get(userId) ?? {...DEFAULT_STATE};
}

export function setUserRole(userId: number, role: UserRole) {
	updateUserState(userId, {role});
}

export function setUserState(userId: number, state: UserState): void {
	userStates.set(userId, state);
}

export function updateUserState(
	userId: number,
	patch: Partial<UserState>
): UserState {
	const current = getUserState(userId);
	const next = {...current, ...patch};

	userStates.set(userId, next);
	return next;
}

export function resetUserState(userId: number): void {
	userStates.delete(userId);
}

export function isUserInMode(userId: number, mode: UserMode): boolean {
	return getUserState(userId).mode === mode;
}

export function getAllUserStates(): Record<number, UserState> {
	return Object.fromEntries(userStates.entries());
}
