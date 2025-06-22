import { Logtail } from "@logtail/node";

const logtail = new Logtail("***REMOVED***", {
  endpoint: "https://s1356404.eu-nbg-2.betterstackdata.com",
});

["debug", "log", "info", "warn", "error"].forEach((level) => {
  const original = Reflect.get(console, level);
  const logger = Reflect.get(logtail, level);
  Reflect.set(console, level, (message: string, ...metadata: unknown[]) => {
    original.call(console, message, ...metadata);
    logger.call(logtail, message, ...metadata);
  });
});

process.on("exit", () => {
  // Ensure that all logs are sent to Logtail
  logtail.flush();
});
