import fs from "fs";
import path from "path";
import crypto from "crypto";

// Пишем во временный файл рядом с целевым (та же файловая система => rename атомарен)
// и переименовываем поверх цели. При падении процесса мидрайта портится только temp-файл,
// а не рабочие данные.
export function writeJsonFileAtomic(filePath: string, data: unknown) {
  const dir = path.dirname(filePath);
  const tmpPath = path.join(
    dir,
    `.${path.basename(filePath)}.${process.pid}.${crypto.randomBytes(4).toString("hex")}.tmp`
  );

  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmpPath, filePath);
}
