import { captureException } from "@sentry/react-router";
import debug from "debug";
import { DateTime } from "luxon";
import prisma from "~/lib/prisma";
import type { Route } from "~/types/app/+types/root";

const logger = debug("server:middleware:bot");

/**
 * Known bot patterns for classification
 */
const BOT_PATTERNS = [
  { pattern: /googlebot/i, type: "Googlebot" },
  { pattern: /bingbot/i, type: "Bingbot" },
  { pattern: /slurp/i, type: "Yahoo Slurp" },
  { pattern: /duckduckbot/i, type: "DuckDuckBot" },
  { pattern: /baiduspider/i, type: "Baiduspider" },
  { pattern: /yandexbot/i, type: "YandexBot" },
  { pattern: /facebookexternalhit/i, type: "Facebook Bot" },
  { pattern: /twitterbot/i, type: "TwitterBot" },
  { pattern: /linkedinbot/i, type: "LinkedInBot" },
  { pattern: /whatsapp/i, type: "WhatsApp Bot" },
  { pattern: /telegrambot/i, type: "Telegram Bot" },
  { pattern: /discordbot/i, type: "Discord Bot" },
  { pattern: /slackbot/i, type: "Slackbot" },
  { pattern: /anthropic-ai/i, type: "Claude Bot" },
  { pattern: /gptbot|chatgpt-user/i, type: "GPT Bot" },
  { pattern: /claudebot/i, type: "Claude Bot" },
  { pattern: /perplexitybot/i, type: "Perplexity Bot" },
  { pattern: /applebot/i, type: "Applebot" },
  { pattern: /amazonbot/i, type: "Amazonbot" },
  { pattern: /semrushbot/i, type: "SEMrushBot" },
  { pattern: /ahrefsbot/i, type: "AhrefsBot" },
  { pattern: /mj12bot/i, type: "Majestic Bot" },
  { pattern: /dotbot/i, type: "DotBot" },
  { pattern: /rogerbot/i, type: "Rogerbot" },
  { pattern: /exabot/i, type: "Exabot" },
  { pattern: /ia_archiver/i, type: "Alexa Crawler" },
  { pattern: /archive\.org_bot/i, type: "Archive.org Bot" },
  { pattern: /uptimerobot/i, type: "UptimeRobot" },
  { pattern: /pingdom/i, type: "Pingdom Bot" },
  { pattern: /lighthouse/i, type: "Lighthouse" },
  { pattern: /chrome-lighthouse/i, type: "Lighthouse" },
  { pattern: /headlesschrome/i, type: "Headless Chrome" },
  { pattern: /phantomjs/i, type: "PhantomJS" },
  { pattern: /selenium/i, type: "Selenium" },
  { pattern: /webdriver/i, type: "WebDriver" },
  { pattern: /python-requests/i, type: "Python Requests" },
  { pattern: /curl/i, type: "cURL" },
  { pattern: /wget/i, type: "wget" },
  { pattern: /scrapy/i, type: "Scrapy" },
];

/**
 * Classify user agent into bot type
 */
function classifyBot(userAgent: string): string | null {
  for (const { pattern, type } of BOT_PATTERNS)
    if (pattern.test(userAgent)) return type;
  // Generic bot detection
  if (/bot|crawl|spider|scrape/i.test(userAgent)) return "Other Bot";
  return null;
}

/**
 * Check if user agent is a bot
 */
function isBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return classifyBot(userAgent) !== null;
}

/**
 * Track bot visits in database
 */
export async function trackBotVisit(request: Request): Promise<void> {
  const userAgent = request.headers.get("user-agent");
  if (!userAgent || !isBot(userAgent)) return;

  const botType = classifyBot(userAgent ?? "") ?? "Unknown";
  const date = DateTime.utc().startOf("day").toJSDate();
  const path = new URL(request.url).pathname;
  const ip = request.headers.get("x-real-ip");

  try {
    await prisma.botVisit.upsert({
      where: {
        date_userAgent_path: { date, userAgent, path },
      },
      update: {
        count: { increment: 1 },
        ip,
        lastSeen: new Date(),
      },
      create: { botType, count: 1, date, ip, path, userAgent },
    });
    logger("Tracked bot visit:", { botType, path });
  } catch (error) {
    captureException(error, { extra: { botType, path, userAgent, ip } });
    logger("Error tracking bot visit:", error);
  }
}

/**
 * Middleware to track bot visits
 */
export const botTrackingMiddleware: Route.MiddlewareFunction = async (
  { request },
  next,
) => {
  trackBotVisit(request);
  return next();
};
