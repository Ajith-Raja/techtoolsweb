import express, { Request, Response, NextFunction } from "express";
import { setupAuth } from "./auth";
import { registerRoutes } from "./routes";
import { serveStatic, log, setupVite } from "./vite";
import { routeSeoMetadata } from "../client/src/lib/seoMetadata";

const PORT = parseInt(process.env.PORT || '5000', 10);
const NON_INDEXABLE_PATHS = new Set(["/results", "/history", "/auth", "/login", "/signup"]);

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function toAbsoluteUrl(baseUrl: string, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getIndexableRoutes(): string[] {
  const extraRoutes = ["/", "/about", "/features"];
  const routeSet = new Set<string>([...extraRoutes, ...Object.keys(routeSeoMetadata)]);

  return Array.from(routeSet)
    .filter((route) => !NON_INDEXABLE_PATHS.has(route))
    .sort((a, b) => a.localeCompare(b));
}

async function main() {
  const app = express();
  app.use(express.json());

  app.get("/robots.txt", (req: Request, res: Response) => {
    const siteUrl = trimTrailingSlash(`${req.protocol}://${req.get("host")}`);
    const robotsText = [
      "User-agent: *",
      "Allow: /",
      "Disallow: /results",
      "Disallow: /history",
      "Disallow: /auth",
      "Disallow: /login",
      "Disallow: /signup",
      `Sitemap: ${siteUrl}/sitemap.xml`,
      "",
    ].join("\n");

    res.set("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send(robotsText);
  });

  app.get("/sitemap.xml", (_req: Request, res: Response) => {
    const requestProtocol = _req.protocol || "https";
    const requestHost = _req.get("host") || "techtoolsweb.com";
    const baseUrl = trimTrailingSlash(`${requestProtocol}://${requestHost}`);
    const today = new Date().toISOString().split("T")[0];
    const urls = getIndexableRoutes();

    const urlNodes = urls
      .map((route) => {
        const loc = xmlEscape(toAbsoluteUrl(baseUrl, route));
        return [
          "  <url>",
          `    <loc>${loc}</loc>`,
          `    <lastmod>${today}</lastmod>`,
          "    <changefreq>weekly</changefreq>",
          "    <priority>0.7</priority>",
          "  </url>",
        ].join("\n");
      })
      .join("\n");

    const sitemapXml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      urlNodes,
      "</urlset>",
      "",
    ].join("\n");

    res.set("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(sitemapXml);
  });


  // Register API routes
  const server = await registerRoutes(app);

  // Handle errors
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    log(`Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  });

  // Setup Vite or serve static files
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    await setupVite(app, server);
  }

  // Start the server
  let currentPort = PORT;
  const startServer = () => {
    server.listen(currentPort, "0.0.0.0", () => {
      log(`serving on port ${currentPort}`);
    });
  };

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      log(`Port ${currentPort} is in use, trying port ${Number(currentPort) + 1}`);
      currentPort = Number(currentPort) + 1;
      startServer();
    } else {
      log(`Error starting server: ${err.message}`);
    }
  });

  startServer();
}

main().catch((err) => {
  console.error("Failed to start server:", err);
});