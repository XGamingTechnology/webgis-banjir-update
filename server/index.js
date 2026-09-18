const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT || 3000);
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": status === 200 ? "no-cache" : "no-store" });
  res.end(body);
}

function safePath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const requested = decoded === "/" ? "/index.html" : decoded;
  const normalized = path.normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const full = path.resolve(ROOT, `.${normalized.startsWith("/") ? normalized : `/${normalized}`}`);
  return full.startsWith(ROOT) ? full : null;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (url.pathname === "/health") return send(res, 200, JSON.stringify({ status: "ok", service: "webgis-banjir-client-demo" }), "application/json; charset=utf-8");
  const filePath = safePath(url.pathname);
  if (!filePath) return send(res, 403, "Forbidden");
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) return send(res, 404, "Not Found");
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": "no-cache" });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, "0.0.0.0", () => console.log(`WebGIS client demo listening on http://0.0.0.0:${PORT}`));
