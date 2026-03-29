export type UserRoleWithoutAdmins = "retail" | "wholesale";
export type UserRole = UserRoleWithoutAdmins | "superadmin" | "admin";

export interface User {
	id: number;
	role: UserRole;
  username?: string;
}
