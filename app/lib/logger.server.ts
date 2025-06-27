import { format } from "node:util";
import { Logtail } from "@logtail/node";
import chalk from "chalk";
import env from "env-var";

const logtailToken = env.get("LOGTAIL_TOKEN").required().asString();
const logtailEndpoint = env.get("LOGTAIL_ENDPOINT").required().asString();

const logtail = new Logtail(logtailToken, { endpoint: logtailEndpoint });

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
    const formattedMessage = format(message, ...metadata);
    original.call(console, color(formattedMessage));
    logger.call(logtail, formattedMessage, ...metadata);
  });
});

process.on("exit", () => {
  // Ensure that all logs are sent to Logtail
  logtail.flush();
});
