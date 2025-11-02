// --- Імпорт необхідних модулів ---
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');
const superagent = require('superagent');

// --- Налаштування аргументів командного рядка ---
program
  .requiredOption('-h, --host <host>', 'адреса сервера')
  .requiredOption('-p, --port <port>', 'порт сервера')
  .requiredOption('-c, --cache <path>', 'шлях до директорії кешу');
program.parse(process.argv);
const options = program.opts();

// --- Створити кеш-директорію, якщо її немає ---
fs.mkdir(options.cache, { recursive: true });

const server = http.createServer(async (req, res) => {
  const code = req.url.slice(1); // Наприклад, /404 -> "404"
  const filePath = path.join(options.cache, `${code}.jpg`);

  if (!code) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Вкажіть код у URL, напр. /200');
    return;
  }

  try {
    switch (req.method) {
      // --- GET: отримати картинку ---
      case 'GET': {
        try {
          //  спроба знайти у кеші
          const data = await fs.readFile(filePath);
          res.writeHead(200, { 'Content-Type': 'image/jpeg' });
          res.end(data);
        } catch {
          //  якщо немає — завантажуємо з https://http.cat
          try {
            const response = await superagent.get(`https://http.cat/${code}`);
            await fs.writeFile(filePath, response.body);
            res.writeHead(200, { 'Content-Type': 'image/jpeg' });
            res.end(response.body);
          } catch {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Картинку не знайдено ні у кеші, ні на сайті http.cat');
          }
        }
        break;
      }

      // --- PUT: записати картинку у кеш ---
      case 'PUT': {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', async () => {
          const data = Buffer.concat(chunks);
          await fs.writeFile(filePath, data);
          res.writeHead(201, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Картинку збережено у кеш');
        });
        break;
      }

      // --- DELETE: видалити картинку з кешу ---
      case 'DELETE': {
        await fs.unlink(filePath);
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Картинку видалено з кешу');
        break;
      }

      // --- Інші методи ---
      default:
        res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Метод не дозволено');
    }
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Помилка сервера');
  }
});

// --- Запуск сервера ---
server.listen(options.port, options.host, () => {
  console.log(`Сервер запущено: http://${options.host}:${options.port}`);
});
