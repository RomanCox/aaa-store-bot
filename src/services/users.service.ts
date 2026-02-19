import fs from "fs";
import path from "path";
import { User, UserRole } from "../types";
import { PAGINATION_TEXTS, USERS_ERRORS } from "../texts";
import TelegramBot from "node-telegram-bot-api";
import { getChatState, setChatState } from "../state/chat.state";
import { showUsersList } from "../handlers/users/users.handler";
import { renderScreen } from "../render/renderScreen";

const USERS_PATH = path.resolve(__dirname, "../data/users.json");

let users = new Map<number, User>();

export function loadUsers() {
	if (!fs.existsSync(USERS_PATH)) {
		users = new Map();
		return;
	}

	try {
		const raw = JSON.parse(
			fs.readFileSync(USERS_PATH, "utf-8")
		) as User[];
		users = new Map(raw.map((user: User) => [user.id, user]));
	} catch (e) {
		console.error(USERS_ERRORS.FAILED_LOAD, e);
		users = new Map();
	}
}

export function getUser(userId: number): User | undefined {
	return users.get(userId);
}

export function getUserRole(userId: number): UserRole | undefined {
	return users.get(userId)?.role;
}

export function getAllUsers(): User[] {
	return Array.from(users.values());
}

export async function createUser(user: User) {
	if (users.has(user.id)) {
		throw new Error(USERS_ERRORS.USER_EXISTS);
	}

	users.set(user.id, user);
	persist();
}

export async function deleteUser(userId: number) {
	if (!users.has(userId)) {
		throw new Error(USERS_ERRORS.USER_NOT_FOUND);
	}

	users.delete(userId);
	persist();
}

export async function updateUserRole(userId: number, role: User["role"]) {
	const user = users.get(userId);
	if (!user) throw new Error(USERS_ERRORS.USER_NOT_FOUND);

	user.role = role;
	persist();
}

function persist() {
	const data = Array.from(users.values());
	fs.writeFileSync(
		USERS_PATH,
		JSON.stringify(data, null, 2),
		"utf-8"
	);
}

export function isAllowed(userId: number): boolean {
	return users.has(userId);
}

export function isAdmin(userId: number): boolean {
	const role = users.get(userId)?.role;
	return role === "admin" || role === "superadmin";
}

export function isSuperAdmin(userId: number): boolean {
	return users.get(userId)?.role === "superadmin";
}

export async function usersPageInputHandler(
  bot: TelegramBot,
  chatId: number,
  text: string
) {
  const page = Number(text);
  const state = getChatState(chatId);

  if (!Number.isInteger(page) || page < 1) {
    await renderScreen(bot, chatId, PAGINATION_TEXTS.ERROR_PAGE);
    return;
  }

  if (page < 1 || page > (state.usersTotalPages ?? 0)) {
    await renderScreen(bot, chatId, PAGINATION_TEXTS.PAGE_FROM_TO + state.usersTotalPages);
    return;
  }

  setChatState(chatId, {
    usersPage: page,
  });
  await showUsersList(bot, chatId);
}