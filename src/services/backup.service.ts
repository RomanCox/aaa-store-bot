import * as fs from 'fs';
import * as path from 'path';
import cron from 'node-cron';

const SOURCE_FILE = path.join(__dirname, '../../data/products-cache.json');
const BACKUP_DIR = path.join(__dirname, '../../backups');
const MAX_BACKUPS = 100;

// Убедимся, что папка для бэкапов существует
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function createBackup() {
  if (!fs.existsSync(SOURCE_FILE)) {
    console.warn('[Backup] Исходный файл не найден, пропускаем');
    return;
  }

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-'); // 2026-07-05T12-34-56-789Z
  const backupName = `products-cache-${timestamp}.json`;
  const backupPath = path.join(BACKUP_DIR, backupName);

  fs.copyFileSync(SOURCE_FILE, backupPath);
  console.log(`[Backup] Создан бэкап: ${backupName}`);

  // Удаляем старые бэкапы, если превышен лимит
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('products-cache-') && f.endsWith('.json'))
    .sort(); // сортировка по имени (временная метка в начале)

  if (files.length > MAX_BACKUPS) {
    const toDelete = files.slice(0, files.length - MAX_BACKUPS);
    for (const file of toDelete) {
      fs.unlinkSync(path.join(BACKUP_DIR, file));
      console.log(`[Backup] Удалён старый бэкап: ${file}`);
    }
  }
}

// Запуск по расписанию – каждый день в 22:00
cron.schedule('0 22 * * *', () => {
  createBackup();
});

console.log('[Backup] Сервис бэкапов запущен (ежедневно в 03:00)');