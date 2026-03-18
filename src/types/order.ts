import { ProductForCart } from "./product";

export interface Order {
  id: string;
  userId: number;
  username?: string;
  fullName?: string;
  items: ProductForCart[];
  total: number;
  status: "new" | "accepted" | "rejected";
  createdAt: string;
}