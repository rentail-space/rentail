import { format } from "node:util";
import { Logtail } from "@logtail/node";
import type { ILogLevel } from "@logtail/types";
import chalk from "chalk";
import env from "env-var";

const logtailToken = env.get("LOGTAIL_TOKEN").required().asString();
const logtailEndpoint = env.get("LOGTAIL_ENDPOINT").required().asString();

const logtail = new Logtail(logtailToken, { endpoint: logtailEndpoint });

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
    const logtailFunction = Reflect.get(logtail, level);
    const colorCode = process.stdout.isTTY
      ? colors[level as keyof typeof colors]
      : (message: string) => message;

    Reflect.set(console, level, (message: string, ...metadata: unknown[]) => {
      const formattedMessage = format(message, ...metadata);
      consoleOriginal.call(console, colorCode(formattedMessage));
      if (process.env.NODE_ENV === "production")
        logtailFunction.call(logtail, formattedMessage, ...metadata);
    });
  },
);

process.on("exit", () => {
  // Ensure that all logs are sent to Logtail
  logtail.flush();
});

export default logtail;
