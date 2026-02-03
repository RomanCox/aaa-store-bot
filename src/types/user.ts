export type UserRole = "superadmin" | "admin" | "retail" | "wholesale";

export interface User {
	id: number;
	role: UserRole;
}

export type UserMode =
	| "upload_xlsx"
	| "manage_users"
	| "idle";

export interface UserState {
	mode: UserMode;
	role?: UserRole;
	step?: number;
	payload?: unknown;
}