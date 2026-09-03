import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const rootArgument = process.argv[2] || ".";
const port = Number(process.argv[3] || 5173);
const root = resolve(process.cwd(), rootArgument);
const rootPrefix = `${root.toLowerCase()}${sep}`;

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    const pathname = decodeURIComponent(requestUrl.pathname);
    const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    let filePath = resolve(root, relativePath);
    const normalizedPath = filePath.toLowerCase();

    if (filePath !== root && !normalizedPath.startsWith(rootPrefix)) {
      response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Доступ запрещён");
      return;
    }

    if ((await stat(filePath)).isDirectory()) {
      filePath = resolve(filePath, "index.html");
    }

    const data = await readFile(filePath);
    const contentType = contentTypes[extname(filePath).toLowerCase()] || "application/octet-stream";
    response.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-cache",
    });
    response.end(data);
  } catch (error) {
    const status = error?.code === "ENOENT" ? 404 : 500;
    response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(status === 404 ? "Файл не найден" : "Ошибка сервера");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Игловод: http://127.0.0.1:${port}`);
  console.log(`Корневая папка: ${root}`);
});
