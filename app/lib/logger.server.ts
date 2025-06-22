import { Logtail } from "@logtail/node";
import chalk from "chalk";

const logtail = new Logtail("***REMOVED***", {
  endpoint: "https://s1356404.eu-nbg-2.betterstackdata.com",
});

const colors = {
  debug: chalk.blue,
  log: chalk.white,
  info: chalk.green,
  warn: chalk.yellow,
  error: chalk.red,
};

["debug", "log", "info", "warn", "error"].forEach((level) => {
  const original = Reflect.get(console, level);
  const logger = Reflect.get(logtail, level);
  const color = process.stdout.isTTY
    ? colors[level as keyof typeof colors]
    : (message: string) => message;

  Reflect.set(console, level, (message: string, ...metadata: unknown[]) => {
    original.call(console, color(message), ...metadata);
    logger.call(logtail, message, ...metadata);
  });
});

process.on("exit", () => {
  // Ensure that all logs are sent to Logtail
  logtail.flush();
});
