import { captureException } from "@sentry/react-router";
import debug from "debug";
import { DateTime } from "luxon";
import prisma from "~/lib/prisma";
import type { Route } from "~/types/app/+types/root";

const logger = debug("server:middleware:bot");

/**
 * Known bot patterns for classification
 *
 * @see https://www.xseek.io/docs
 * @see https://plainsignal.com/agents/
 */
const BOT_PATTERNS = [
  { pattern: /ahrefsbot/i, type: "AhrefsBot" },
  { pattern: /amazonbot/i, type: "Amazonbot" },
  { pattern: /anthropic-ai/i, type: "Claude Bot" },
  { pattern: /applebot/i, type: "Applebot" },
  { pattern: /archive\.org_bot/i, type: "Archive.org Bot" },
  { pattern: /baiduspider/i, type: "Baiduspider" },
  { pattern: /bingbot/i, type: "Bingbot" },
  { pattern: /bytespider/i, type: "ByteDance Spider" },
  { pattern: /chrome-lighthouse/i, type: "Lighthouse" },
  { pattern: /claude-searchbot/i, type: "Claude Search Bot" },
  { pattern: /claude-user/i, type: "Claude User" },
  { pattern: /claudebot/i, type: "Claude Bot" },
  { pattern: /curl/i, type: "cURL" },
  { pattern: /discordbot/i, type: "Discord Bot" },
  { pattern: /dotbot/i, type: "DotBot" },
  { pattern: /duckduckbot/i, type: "DuckDuckBot" },
  { pattern: /ev-crawler/i, type: "Headline crawler" },
  { pattern: /exabot/i, type: "Exabot" },
  { pattern: /facebookexternalhit/i, type: "Facebook Bot" },
  { pattern: /findfiles.net/i, type: "FindFiles.net" },
  { pattern: /googlebot/i, type: "Googlebot" },
  { pattern: /gptbot|chatgpt-user/i, type: "GPT Bot" },
  { pattern: /headlesschrome/i, type: "Headless Chrome" },
  { pattern: /ia_archiver/i, type: "Alexa Crawler" },
  { pattern: /lighthouse/i, type: "Lighthouse" },
  { pattern: /linkedinbot/i, type: "LinkedInBot" },
  { pattern: /meta-externalagent/i, type: "Meta External Agent" },
  { pattern: /mj12bot/i, type: "Majestic Bot" },
  { pattern: /oai-searchbot/i, type: "OAI Search Bot" },
  { pattern: /perplexitybot/i, type: "Perplexity Bot" },
  { pattern: /phantomjs/i, type: "PhantomJS" },
  { pattern: /pingdom/i, type: "Pingdom Bot" },
  { pattern: /python-requests/i, type: "Python Requests" },
  { pattern: /rogerbot/i, type: "Rogerbot" },
  { pattern: /rss-is-dead.lol/i, type: "RSS is Dead" },
  { pattern: /saasbrowser.com/i, type: "SaaS Browser" },
  { pattern: /scrapy/i, type: "Scrapy" },
  { pattern: /selenium/i, type: "Selenium" },
  { pattern: /semrushbot/i, type: "SEMrushBot" },
  { pattern: /slackbot/i, type: "Slackbot" },
  { pattern: /slurp/i, type: "Yahoo Slurp" },
  { pattern: /telegrambot/i, type: "Telegram Bot" },
  { pattern: /twitterbot/i, type: "TwitterBot" },
  { pattern: /uptimerobot/i, type: "UptimeRobot" },
  { pattern: /webdriver/i, type: "WebDriver" },
  { pattern: /wget/i, type: "wget" },
  { pattern: /whatsapp/i, type: "WhatsApp Bot" },
  { pattern: /yandexbot/i, type: "YandexBot" },
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
  if (/Better Stack/i.test(userAgent)) return;

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
