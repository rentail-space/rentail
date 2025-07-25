import { spawn } from "node:child_process";

const server: {
  stop: () => Promise<void>;
  port: number;
} | null = null;

export async function launchServer(port = 9222) {
  if (server) return server;
  const instance = spawn("react-router", ["dev", "--port", port.toString()]);

  return await new Promise<{
    stop(): Promise<void>;
    port: number;
  }>((resolve, reject) => {
    instance.once("error", (error) => reject(error));
    if (instance.stdout === null) return reject("Failed to start server.");
    instance.stdout.on("data", (stream: Buffer) => {
      if (stream.toString().includes(port.toString())) {
        return resolve({
          async stop() {
            if (!instance.killed) instance.kill();
          },
          port,
        });
      }
    });
  });
}

export const URL = "http://localhost:9222";
