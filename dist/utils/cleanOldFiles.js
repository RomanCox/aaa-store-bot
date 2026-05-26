"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanOldFiles = cleanOldFiles;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
async function cleanOldFiles(folderPath, maxAgeDays, extension) {
    try {
        const now = Date.now();
        const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
        const files = await promises_1.default.readdir(folderPath).catch(() => {
            console.warn(`Папка ${folderPath} не существует, очистка пропущена.`);
            return [];
        });
        let deletedCount = 0;
        await Promise.all(files.map(async (file) => {
            const filePath = path_1.default.join(folderPath, file);
            try {
                const stats = await promises_1.default.stat(filePath);
                if (!stats.isFile())
                    return;
                if (extension && path_1.default.extname(file) !== extension)
                    return;
                const fileAge = now - stats.mtimeMs;
                if (fileAge > maxAgeMs) {
                    await promises_1.default.unlink(filePath);
                    deletedCount++;
                    console.log(`Удалён: ${file} (${Math.round(fileAge / 86400000)} дней)`);
                }
            }
            catch (e) {
                // 🔥 важно — не ломаем весь процесс
                console.warn(`Ошибка обработки файла ${filePath}:`, e);
            }
        }));
        if (deletedCount > 0) {
            console.log(`Очистка ${folderPath}: удалено ${deletedCount} файлов`);
        }
        return deletedCount;
    }
    catch (error) {
        console.error(`Ошибка при очистке папки ${folderPath}:`, error);
        return 0;
    }
}
