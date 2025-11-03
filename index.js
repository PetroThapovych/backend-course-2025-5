import { Command } from "commander";
import http from "http";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import superagent from "superagent";


const program = new Command();

program
  .requiredOption("-h, --host <string>", "адреса сервера (обов'язково)")
  .requiredOption("-p, --port <number>", "порт сервера (обов'язково)")
  .requiredOption("-c, --cache <path>", "шлях до директорії кешу (обов'язково)")
  .parse(process.argv);

const options = program.opts();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cacheDir = path.resolve(__dirname, options.cache);


try {
  await fs.mkdir(cacheDir, { recursive: true });
  console.log(`Директорія кешу: ${cacheDir}`);
} catch (err) {
  console.error("Помилка створення директорії кешу:", err);
  process.exit(1);
}


const server = http.createServer(async (req, res) => {
  const method = req.method;
  const urlPath = req.url;
  const code = urlPath.slice(1);

  if (!code) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Не вказано код HTTP у URL (наприклад, /200)");
    return;
  }

  const filePath = path.join(cacheDir, `${code}.jpg`);

  try {

    if (method === "GET") {
      try {
        // якщо картинка є в кеші
        const data = await fs.readFile(filePath);
        res.writeHead(200, { "Content-Type": "image/jpeg" });
        res.end(data);
      } catch (err) {

        try {
          const response = await superagent.get(`https://http.cat/${code}`);
          const buffer = response.body;

          // зберігаємо у кеш
          await fs.writeFile(filePath, buffer);
          res.writeHead(200, { "Content-Type": "image/jpeg" });
          res.end(buffer);
        } catch (fetchErr) {

          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          res.end(`Картинку з кодом ${code} не знайдено ні в кеші, ні на http.cat.`);
        }
      }
    }

    else if (method === "PUT") {
      let body = [];
      for await (const chunk of req) body.push(chunk);
      const buffer = Buffer.concat(body);

      await fs.writeFile(filePath, buffer);
      res.writeHead(201, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`Картинку з кодом ${code} збережено у кеш.`);
    }

    else if (method === "DELETE") {
      await fs.unlink(filePath);
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`Картинку ${code}.jpg видалено.`);
    }

    else {
      res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Method Not Allowed");
    }
  } catch (err) {
    if (err.code === "ENOENT") {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`Файл ${code}.jpg не знайдено у кеші.`);
    } else {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`Внутрішня помилка сервера: ${err.message}`);
    }
  }
});

server.listen(options.port, options.host, () => {
  console.log(`Сервер запущено на http://${options.host}:${options.port}`);
});
