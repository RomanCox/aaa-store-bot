import type { UserRole } from "../types/user";
import { ITEM_TEXTS } from "../texts/item.texts";

// Роли менеджеров наследуют клиентские цены и сценарии, но не права админа.
export function getPricingRole(role?: UserRole) {
  if (role === "manager_retail") return "retail";
  if (role === "manager_wholesale") return "wholesale";
  return role;
}

export function canSeeWarehouse(role?: UserRole): boolean {
  return role === "manager_retail" || role === "manager_wholesale" ||
    role === "wholesale" || role === "admin" || role === "superadmin";
}

export function getWarehouseMarker(product: { inWarehouse?: boolean }, role?: UserRole): string {
  return product.inWarehouse && canSeeWarehouse(role) ? ` ${ITEM_TEXTS.IN_WAREHOUSE}` : "";
}

export function getAssignableRoles(superAdmin: boolean): UserRole[] {
  const roles: UserRole[] = ["retail", "wholesale", "manager_retail", "manager_wholesale"];
  return superAdmin ? [...roles, "admin", "superadmin"] : roles;
}

export function isAssignableRole(role: string | undefined, superAdmin: boolean): role is UserRole {
  return getAssignableRoles(superAdmin).some(allowed => allowed === role);
}
