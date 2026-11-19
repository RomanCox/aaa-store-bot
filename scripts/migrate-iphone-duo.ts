// По умолчанию — просмотр. --apply делает бэкап и атомарно записывает кеш.
// При ручном --apply бот должен быть остановлен.
import { migrateIphoneDuoCache } from "../src/migrations";
import { loadColorsFromFile } from "../src/services/colors.service";

function main() {
  let apply = false;
  let cachePath: string | undefined;
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--apply") apply = true;
    else if (args[i] === "--cache" && args[i + 1] && !args[i + 1].startsWith("--")) cachePath = args[++i];
    else throw new Error(`Неизвестный аргумент или отсутствующий путь: ${args[i]}. Допустимы --apply и --cache <путь>.`);
  }
  loadColorsFromFile();
  migrateIphoneDuoCache({ apply, cachePath });
  if (!apply) console.log("Предварительный просмотр без записи. Для применения используйте --apply с остановленным ботом.");
}

if (require.main === module) {
  try { main(); }
  catch (error) { console.error(error); process.exitCode = 1; }
}
