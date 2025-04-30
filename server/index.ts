import express, { Request, Response, NextFunction } from "express";
import { setupAuth } from "./auth";
import { registerRoutes } from "./routes";
import { serveStatic, log, setupVite } from "./vite";

const PORT = parseInt(process.env.PORT || '5001', 10);

async function main() {
  const app = express();
  app.use(express.json());


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