// server.js створено
// Імпорт необхідних модулів
const http = require('http');
const fs = require('fs');
const { program } = require('commander');

// --- 1. Налаштування аргументів командного рядка ---
program
  .requiredOption('-h, --host <host>', 'адреса сервера')
  .requiredOption('-p, --port <port>', 'порт сервера')
  .requiredOption('-c, --cache <path>', 'шлях до директорії кешу');

program.parse(process.argv);
const options = program.opts();

// --- 2. Перевірка існування директорії кешу ---
if (!fs.existsSync(options.cache)) {
  fs.mkdirSync(options.cache, { recursive: true });
  console.log(`Створено директорію кешу: ${options.cache}`);
}

// --- 3. Створення простого HTTP-сервера ---
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Проксі-сервер працює! Ви на етапі 1 лабораторної №5.');
});

// --- 4. Запуск сервера ---
server.listen(options.port, options.host, () => {
  console.log(`Сервер запущено: http://${options.host}:${options.port}`);
});
