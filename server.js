const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');

program
  .requiredOption('-h, --host <host>', 'адреса сервера')
  .requiredOption('-p, --port <port>', 'порт сервера')
  .requiredOption('-c, --cache <path>', 'шлях до директорії кешу');
program.parse(process.argv);
const options = program.opts();

fs.mkdir(options.cache, { recursive: true });

const server = http.createServer(async (req, res) => {
  const code = req.url.slice(1); // наприклад, "/200" → "200"
  const filePath = path.join(options.cache, `${code}.jpg`);

  if (!code) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Вкажіть код у URL, напр. /200');
    return;
  }

  try {
    switch (req.method) {
      case 'GET': {
        const data = await fs.readFile(filePath);
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(data);
        break;
      }
      case 'PUT': {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', async () => {
          const data = Buffer.concat(chunks);
          await fs.writeFile(filePath, data);
          res.writeHead(201, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Картинку збережено');
        });
        break;
      }
      case 'DELETE': {
        await fs.unlink(filePath);
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Файл видалено');
        break;
      }
      default:
        res.writeHead(405);
        res.end('Метод не дозволено');
    }
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Не знайдено');
  }
});

server.listen(options.port, options.host, () => {
  console.log(`Сервер запущено: http://${options.host}:${options.port}`);
});
