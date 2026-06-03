import path from "path";
import os from "os";
import fs from "fs";

function resolvePath(p: string) {
  if (p.startsWith("~")) {
    return path.join(os.homedir(), p.slice(1));
  }
  return path.resolve(p);
}

export function saveCsvToFile(csv: string) {
  const dir = resolvePath(process.env.EXPORT_CSV_PATH || "/var/data/exports");

  // 👉 создаем папку если нет
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {recursive: true});
  }

  const filePath = path.join(dir, "products.csv");

  fs.writeFileSync(filePath, csv, "utf-8");
}