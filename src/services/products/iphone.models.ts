import { Product } from "../../types";
import { removeColorFromName } from "../colors.service";

// Семейство для сортировки/сообщений определяем по названию: в старом кеше
// model иногда равен "Duo" или содержит память и цвет вместо одной модели.
export function getIphoneGroupKey(product: Product): string | null {
  if (product.brand?.toLowerCase() !== "apple" || product.category.toLowerCase() !== "смартфоны") return null;
  for (const value of [product.name, product.model]) {
    const match = value.match(/\biphone\s*(\d{1,2})(?!\d)|\biphone\s+(air|duo|se|xr|xs|x|fold)\b/i);
    if (match) return (match[1] ?? match[2]).toLowerCase();
  }
  return null;
}

// Узкая проверка полноценных названий Air/Duo, а не любое вхождение "iPhone".
// Не переводим в смартфоны чехлы, зарядки и комплекты, содержащие модель телефона.
export function getNamedIphoneDeviceModel(name: string): string | undefined {
  // Цвета Duo ещё могут отсутствовать в конфиге; это явные варианты названия,
  // а не изменение правил цвета/идентичности товара.
  const withoutColor = removeColorFromName(name.trim().replace(/\b(?:night\s*sky|star\s*white)\b/gi, " "));
  const match = withoutColor.match(/^(?:apple\s+)?iphone\s+(air|duo)\s+(?:64|128|256|512|1024|2048|4096|[1-4]\s*tb)(?:\s*gb)?\b/i);
  if (!match) return undefined;
  const rest = withoutColor.slice(match[0].length)
    .replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, " ")
    .replace(/\((?:active|esim|sim\s*\+\s*esim|dual\s*sim|sim)\)/gi, " ");
  if (rest.trim()) return undefined;
  return match[1].toLowerCase() === "air" ? "iPhone Air" : "iPhone Duo";
}
