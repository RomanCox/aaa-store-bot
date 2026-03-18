export function storageToNumber(storage?: string): number {
  if (!storage) return 0;

  const s = storage.toUpperCase();
  const match = s.match(/(\d+)/);
  if (!match) return 0;

  const value = Number(match[1]);

  if (s.includes("TB")) return value * 1024;
  return value;
}

export function extractMemorySubstring(name: string): string | null {
  const text = name.trim();

  // 1. Скобки у компьютеров (8/8/8/512) или (8/512)
  const bracketMatch = text.match(/\(([\d/]+\s*(?:TB|Tb|GB|Gb)?)\)/);
  if (bracketMatch) return bracketMatch[1];

  // 2. Формат RAM/Storage (8/256, 12/1TB)
  const slashMatch = text.match(/\d+\s*\/\s*\d+\s*(?:TB|Tb|GB|Gb)?/);
  if (slashMatch) return slashMatch[0];

  // 3. TB / GB
  const tbgbMatch = text.match(/\d+\s*(?:TB|Tb|GB|Gb)/);
  if (tbgbMatch) return tbgbMatch[0];

  // 4. просто число (обычно у iPhone)
  const numbers = text.match(/\b\d{2,4}\b/g);
  if (numbers) {
    const last = numbers[numbers.length - 1];
    if ([64,128,256,512].includes(Number(last))) {
      return last;
    }
  }

  return null;
}

export function parseSpecs(spec: string | null): number[] {
  if (!spec) return [];

  return spec.split("/").map(part => {
    const p = part.trim().toUpperCase();

    if (p.includes("TB")) {
      return parseFloat(p) * 1024;
    }

    return parseFloat(p);
  });
}

export function compareSpecs(a: string | null, b: string | null): number {
  const arrA = parseSpecs(a);
  const arrB = parseSpecs(b);

  const len = Math.max(arrA.length, arrB.length);

  for (let i = 0; i < len; i++) {
    const valA = arrA[i] ?? 0;
    const valB = arrB[i] ?? 0;

    if (valA !== valB) {
      return valA - valB;
    }
  }

  return 0;
}
