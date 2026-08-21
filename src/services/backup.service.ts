import * as fs from 'fs';
import * as path from 'path';
import cron from 'node-cron';
import {
  BRANDS_PATH,
  COLORS_PATH,
  ORDERS_PATH,
  PRICE_FORMATION_PATH,
  PRODUCTS_CACHE_PATH,
  RATES_PATH,
  USERS_PATH,
} from '../constants';

const BACKUP_DIR = path.join(__dirname, '../../backups');
const MAX_BACKUPS_PER_FILE = 100;

const BACKED_UP_FILES = [
  PRODUCTS_CACHE_PATH,
  ORDERS_PATH,
  USERS_PATH,
  RATES_PATH,
  PRICE_FORMATION_PATH,
  BRANDS_PATH,
  COLORS_PATH,
];

// Убедимся, что папка для бэкапов существует
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function backupFile(sourceFile: string) {
  if (!fs.existsSync(sourceFile)) {
    console.warn(`[Backup] Исходный файл не найден, пропускаем: ${sourceFile}`);
    return;
  }

  const baseName = path.basename(sourceFile, '.json');
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-'); // 2026-07-05T12-34-56-789Z
  const backupName = `${baseName}-${timestamp}.json`;
  const backupPath = path.join(BACKUP_DIR, backupName);

  fs.copyFileSync(sourceFile, backupPath);
  console.log(`[Backup] Создан бэкап: ${backupName}`);

  // Удаляем старые бэкапы этого файла, если превышен лимит
  const prefix = `${baseName}-`;
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith(prefix) && f.endsWith('.json'))
    .sort(); // сортировка по имени (временная метка в начале)

  if (files.length > MAX_BACKUPS_PER_FILE) {
    const toDelete = files.slice(0, files.length - MAX_BACKUPS_PER_FILE);
    for (const file of toDelete) {
      fs.unlinkSync(path.join(BACKUP_DIR, file));
      console.log(`[Backup] Удалён старый бэкап: ${file}`);
    }
  }
}

function createBackup() {
  for (const sourceFile of BACKED_UP_FILES) {
    // Бэкап одного файла не должен прерывать бэкап остальных
    try {
      backupFile(sourceFile);
    } catch (e) {
      console.error(`[Backup] Ошибка бэкапа файла ${sourceFile}:`, e);
    }
  }
}

// Запуск по расписанию – каждый день в 22:00
cron.schedule('0 22 * * *', () => {
  try {
    createBackup();
  } catch (e) {
    console.error('[Backup] Не удалось выполнить плановый бэкап:', e);
  }
});

console.log('[Backup] Сервис бэкапов запущен (ежедневно в 22:00)');
