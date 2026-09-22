import { createIsbotFromList, list } from "isbot";

/**
 * User agents that are always treated as bots, even when isbot's patterns would
 * miss them.
 */
const botUserAgents = [
  "Android 9",
  "Better Stack",
  "CFNetwork",
  "Checkly",
  "FastmailUA",
  "Vercel",
];

/**
 * Check if the user agent is a crawler, monitor or other non-human client.
 *
 * Headless Chrome is excluded from isbot's list: the test suite drives the app
 * with headless Chrome, and those requests must behave like a real visitor
 * (UTM capture, no CDN caching).
 */
export const isCrawler: (userAgent: string) => boolean = createIsbotFromList(
  list
    .filter((record: string): boolean => !/headless/i.test(record))
    .concat(botUserAgents),
);
