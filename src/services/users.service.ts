import fs from "fs";
import path from "path";
import { User } from "../types/user";
import { USERS_ERRORS } from "../texts/users.texts";

const USERS_PATH = path.resolve(__dirname, "../data/users.json");

let users: User[] = [];

export function loadUsers() {
	if (!fs.existsSync(USERS_PATH)) {
		users = [];
		return;
	}

	try {
		users = JSON.parse(
			fs.readFileSync(USERS_PATH, "utf-8")
		) as User[];
	} catch (e) {
		console.error(USERS_ERRORS.FAILED_LOAD, e);
		users = [];
	}
}

export function getUser(userId: number): User | undefined {
	return users.find(u => u.id === userId);
}

export function addUser(user: User) {
	if (getUser(user.id)) {
		throw new Error(USERS_ERRORS.USER_EXISTS);
	}

	users.push(user);
	persist();
}

export function getAllUsers(): User[] {
	return [...users];
}

export function updateUserRole(userId: number, role: User["role"]) {
	const user = getUser(userId);
	if (!user) throw new Error(USERS_ERRORS.USER_NOT_FOUND);

	user.role = role;
	persist();
}

function persist() {
	fs.writeFileSync(
		USERS_PATH,
		JSON.stringify(users, null, 2),
		"utf-8"
	);
}

export function isAllowed(userId: number): boolean {
	return Boolean(getUser(userId));
}

export function isAdmin(userId: number): boolean {
	const user = getUser(userId);
	return user?.role === "admin" || user?.role === "superadmin";
}

export function isSuperAdmin(userId: number): boolean {
	return getUser(userId)?.role === "superadmin";
}

