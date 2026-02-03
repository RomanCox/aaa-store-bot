import { AdminStep } from "../types/navigation";

export const AdminBackMap: Record<AdminStep, AdminStep | null> = {
	main: null,
	users_list: "main",
	upload_xlsx: "main",
};