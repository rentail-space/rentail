import { format, styleText } from "node:util";
import { Logtail } from "@logtail/node";
import type { ILogLevel } from "@logtail/types";
import env from "~/lib/env";

const logtail = env.LOGTAIL_TOKEN
  ? new Logtail(env.LOGTAIL_TOKEN, {
      endpoint: env.LOGTAIL_ENDPOINT,
    })
  : null;

const colors = {
  trace: (text: string) => styleText("gray", text),
  debug: (text: string) => styleText("blue", text),
  log: (text: string) => styleText("red", text),
  info: (text: string) => styleText("green", text),
  warn: (text: string) => styleText("yellow", text),
  error: (text: string) => styleText("red", text),
};

for (const level of [
  "debug",
  "error",
  "info",
  "log",
  "trace",
  "warn",
] as ILogLevel[]) {
  const logtailFunction = logtail ? Reflect.get(logtail, level) : () => {};
  const colorCode = colors[level as keyof typeof colors];

  Reflect.set(console, level, (message: string, ...metadata: unknown[]) => {
    const formattedMessage = format(message, ...metadata);
    process.stdout.write(`${colorCode(formattedMessage)}\n`);
    try {
      logtailFunction.call(logtail, formattedMessage, ...metadata);
    } catch (error) {
      process.stderr.write(
        `${error instanceof Error ? error.message : error}\n`,
      );
    }
  });
}

process.on("SIGTERM", () => {
  // Ensure that all logs are sent to Logtail
  if (logtail) logtail.flush();
});

export default logtail;
