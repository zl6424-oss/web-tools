import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chatHandler from "./api/chat.js";
import translateHandler from "./api/translate.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(root, ".env.local");

function loadLocalEnv() {
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;
    const name = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[name]) process.env[name] = value;
  }
}

loadLocalEnv();

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function sendJson(response, statusCode, value) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value));
}

function makeVercelStyleResponse(response) {
  return {
    setHeader(name, value) { response.setHeader(name, value); },
    status(code) {
      return {
        json(value) { sendJson(response, code, value); }
      };
    }
  };
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1_000_000) throw new Error("Request too large");
  }
  return body ? JSON.parse(body) : {};
}

function serveFile(request, response) {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const requested = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = path.resolve(root, requested);

  if (!filePath.startsWith(root + path.sep) || requested.startsWith(".env") || requested === "server.js") {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendJson(response, 404, { error: "Not found" });
      return;
    }
    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(data);
  });
}

const server = http.createServer(async (request, response) => {
  if (request.url === "/api/chat" && request.method === "POST") {
    try {
      request.body = await readJson(request);
      await chatHandler(request, makeVercelStyleResponse(response));
    } catch (error) {
      console.error(error);
      if (!response.headersSent) sendJson(response, 400, { error: "Invalid request" });
    }
    return;
  }
  if (request.url === "/api/translate" && request.method === "POST") {
    try {
      request.body = await readJson(request);
      await translateHandler(request, makeVercelStyleResponse(response));
    } catch (error) {
      console.error(error);
      if (!response.headersSent) sendJson(response, 400, { error: "Invalid request" });
    }
    return;
  }

  if (request.url === "/api/status") {
    sendJson(response, 200, {
      aiConfigured: Boolean(process.env.DEEPSEEK_API_KEY),
      model: process.env.DEEPSEEK_MODEL || "deepseek-flash"
    });
    return;
  }

  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  serveFile(request, response);
});

let port = Number(process.env.PORT) || 3000;
const maximumPort = port + 9;

function startServer() {
  server.listen(port, "127.0.0.1");
}

server.on("listening", () => {
  console.log("");
  console.log("PCom Assistant");
  console.log("Open: http://localhost:" + port);
  console.log(process.env.DEEPSEEK_API_KEY
    ? "DeepSeek: configured"
    : "DeepSeek: NOT configured — add DEEPSEEK_API_KEY to .env.local");
  console.log("Press Ctrl+C to stop.");
  console.log("");
});

server.on("error", error => {
  if (error.code === "EADDRINUSE" && port < maximumPort) {
    console.log("Port " + port + " is already in use. Trying port " + (port + 1) + "...");
    port += 1;
    setTimeout(startServer, 100);
    return;
  }
  console.error(error);
  process.exit(1);
});

startServer();





