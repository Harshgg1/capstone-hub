import { app } from "./app";
import { config } from "./config";

const server = app.listen(config.port, () => {
  console.log(
    `[CapstoneHub API] Server listening on port ${config.port} (${config.nodeEnv})`,
  );
});

const handleShutdown = (signal: string) => {
  console.log(
    `[CapstoneHub API] Received ${signal}. Initiating graceful shutdown...`,
  );
  server.close(() => {
    console.log("[CapstoneHub API] HTTP server closed.");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("[CapstoneHub API] Forcefully shutting down after timeout.");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

export default server;
