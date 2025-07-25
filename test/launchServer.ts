import { spawn } from "node:child_process";

const port = 9222;
let server:
  | {
      port: number;
      stop: () => boolean;
    }
  | undefined;

export async function launchServer() {
  if (server) return server;
  const instance = spawn("react-router", ["dev", "--port", port.toString()]);

  return await new Promise<{
    port: number;
    stop: () => boolean;
  }>((resolve, reject) => {
    instance.once("error", (error) => reject(error));
    if (instance.stdout === null) return reject("Failed to start server.");
    instance.stdout.on("data", (stream: Buffer) => {
      if (stream.toString().includes(port.toString())) {
        return resolve({
          port,
          stop: () => instance.kill("SIGTERM"),
        });
      }
    });
  });
}

export const URL = `http://localhost:${port}`;
