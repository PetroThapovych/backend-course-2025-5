// =========================
//  Імпорт модулів
// =========================
import { Command } from "commander";
import http from "http";
import fs from "fs";
import path from "path";

// =========================
//  Ініціалізація Commander.js
// =========================
const program = new Command();

program
  .requiredOption("-h, --host <string>", "адреса сервера (обов'язково)")
  .requiredOption("-p, --port <number>", "порт сервера (обов'язково)")
  .requiredOption("-c, --cache <path>", "шлях до директорії кешу (обов'язково)")
  .parse(process.argv);

const options = program.opts();

// =========================
//  Перевірка директорії кешу
// =========================
const cacheDir = path.resolve(options.cache);
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
  console.log(`📁 Створено директорію кешу: ${cacheDir}`);
} else {
  console.log(`📦 Використовується директорія кешу: ${cacheDir}`);
}

// =========================
//  Створення HTTP-сервера
// =========================
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Сервер працює успішно!");
});

// =========================
//  Запуск сервера
// =========================
server.listen(options.port, options.host, () => {
  console.log(`🚀 Сервер запущено на http://${options.host}:${options.port}`);
});
