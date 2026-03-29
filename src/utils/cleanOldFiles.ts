import fs from 'fs/promises';
import path from 'path';

export async function cleanOldFiles(
  folderPath: string,
  maxAgeDays: number,
  extension?: string
): Promise<number> {
  try {
    const now = Date.now();
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

    const files = await fs.readdir(folderPath).catch(() => {
      console.warn(`Папка ${folderPath} не существует, очистка пропущена.`);
      return [];
    });

    let deletedCount = 0;

    await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(folderPath, file);

        try {
          const stats = await fs.stat(filePath);

          if (!stats.isFile()) return;

          if (extension && path.extname(file) !== extension) return;

          const fileAge = now - stats.mtimeMs;

          if (fileAge > maxAgeMs) {
            await fs.unlink(filePath);
            deletedCount++;

            console.log(
              `Удалён: ${file} (${Math.round(fileAge / 86400000)} дней)`
            );
          }
        } catch (e) {
          // 🔥 важно — не ломаем весь процесс
          console.warn(`Ошибка обработки файла ${filePath}:`, e);
        }
      })
    );

    if (deletedCount > 0) {
      console.log(`Очистка ${folderPath}: удалено ${deletedCount} файлов`);
    }

    return deletedCount;
  } catch (error) {
    console.error(`Ошибка при очистке папки ${folderPath}:`, error);
    return 0;
  }
}