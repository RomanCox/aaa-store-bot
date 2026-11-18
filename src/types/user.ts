export type UserRoleWithoutAdmins = "retail" | "wholesale" | "manager_retail" | "manager_wholesale";
export type UserRole = UserRoleWithoutAdmins | "superadmin" | "admin";

export interface User {
	id: number;
	role: UserRole;
  username?: string;
}
