import { format } from "node:util";
import { Logtail } from "@logtail/node";
import type { ILogLevel } from "@logtail/types";
import env from "./env";

const logtail = env.LOGTAIL_TOKEN
  ? new Logtail(env.LOGTAIL_TOKEN, {
      endpoint: env.LOGTAIL_ENDPOINT,
    })
  : null;

const colors = {
  trace: (text: string) => `\x1b[90m${text}\x1b[0m`,
  debug: (text: string) => `\x1b[94m${text}\x1b[0m`,
  log: (text: string) => `\x1b[97m${text}\x1b[0m`,
  info: (text: string) => `\x1b[92m${text}\x1b[0m`,
  warn: (text: string) => `\x1b[93m${text}\x1b[0m`,
  error: (text: string) => `\x1b[91m${text}\x1b[0m`,
};

for (const level of [
  "trace",
  "debug",
  "log",
  "info",
  "warn",
  "error",
] as ILogLevel[]) {
  const consoleOriginal = Reflect.get(console, level);
  const logtailFunction = logtail ? Reflect.get(logtail, level) : () => {};
  const colorCode = process.stdout.isTTY
    ? colors[level as keyof typeof colors]
    : (message: string) => message;

  Reflect.set(console, level, (message: string, ...metadata: unknown[]) => {
    const formattedMessage = format(message, ...metadata);
    consoleOriginal.call(console, colorCode(formattedMessage));
    try {
      logtailFunction.call(logtail, formattedMessage, ...metadata);
    } catch (error) {
      console.error("Error logging to Logtail:", error);
    }
  });
}

process.on("SIGTERM", () => {
  // Ensure that all logs are sent to Logtail
  if (logtail) logtail.flush();
});

export default logtail;
