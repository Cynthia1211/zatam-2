import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { createServer as createPortTester } from "node:net";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const preferredPort = Number(process.env.PORT || 4173);

const types = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

function localPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const requested = normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const fullPath = resolve(root, `.${sep}${requested}`);
  if (!fullPath.startsWith(resolve(root))) return null;
  return fullPath;
}

const server = createServer((request, response) => {
  let fullPath = localPath(request.url || "/");
  if (!fullPath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  if (!existsSync(fullPath)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  if (statSync(fullPath).isDirectory()) {
    fullPath = join(fullPath, "index.html");
  }

  if (!existsSync(fullPath)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": types[extname(fullPath).toLowerCase()] || "application/octet-stream"
  });
  createReadStream(fullPath).pipe(response);
});

function canUsePort(port) {
  return new Promise((resolvePort, rejectPort) => {
    const tester = createPortTester();
    tester.once("error", (error) => {
      if (error.code === "EADDRINUSE" && !process.env.PORT) {
        resolvePort(canUsePort(port + 1));
        return;
      }

      rejectPort(error);
    });
    tester.once("listening", () => {
      tester.close(() => resolvePort(port));
    });
    tester.listen(port);
  });
}

const port = await canUsePort(preferredPort);

server.listen(port, () => {
  console.log(`Dev server running at http://localhost:${port}/`);
  console.log(`Snakes and Ladders: http://localhost:${port}/Games/Snakes%20%26%20Ladders/`);
});
