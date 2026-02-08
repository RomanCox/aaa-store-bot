export type UserRole = "superadmin" | "admin" | "retail" | "wholesale";

export interface User {
	id: number;
	role: UserRole;
}

export type UserMode = "idle"
	| "upload_xlsx"
	| "add_user"
	| "delete_user"
	| "edit_user"
	| "await_page_number";

export interface UserState {
	mode: UserMode;
	role?: UserRole;
	step?: number;
	payload?: unknown;
}