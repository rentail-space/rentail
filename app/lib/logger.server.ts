import type { ILogLevel } from "@logtail/types";
import { createWriteStream } from "node:fs";
import { format, styleText } from "node:util";
import { Logtail } from "@logtail/node";
import { resolve } from "node:path";
import envVars from "~/lib/env";

const logtail = envVars.LOGTAIL_TOKEN
  ? new Logtail(envVars.LOGTAIL_TOKEN, {
      endpoint: envVars.LOGTAIL_ENDPOINT,
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

const logFile = envVars.isTest
  ? createWriteStream(resolve("server.log"), { flags: "a" })
  : null;

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
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      process.stderr.write(`${errorMessage}\n`);
    }
    if (logFile) logFile.write(`${formattedMessage}\n`);
  });
}

process.on("SIGTERM", () => {
  // Ensure that all logs are sent to Logtail
  if (logtail) void logtail.flush();
});

export default logtail;
