import { format } from "node:util";
import { Logtail } from "@logtail/node";
import type { ILogLevel } from "@logtail/types";
import chalk from "chalk";
import env from "./env";

const logtail = env.LOGTAIL_TOKEN
  ? new Logtail(env.LOGTAIL_TOKEN, {
      endpoint: env.LOGTAIL_ENDPOINT,
    })
  : null;

const colors = {
  trace: chalk.gray,
  debug: chalk.blue,
  log: chalk.white,
  info: chalk.green,
  warn: chalk.yellow,
  error: chalk.red,
};

["trace", "debug", "log", "info", "warn", "error"].forEach(
  (level: ILogLevel) => {
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
  },
);

process.on("SIGTERM", () => {
  // Ensure that all logs are sent to Logtail
  if (logtail) logtail.flush();
});

export default logtail;
