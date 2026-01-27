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
  { pattern: /ahrefsbot/i, type: "Ahrefs" },
  { pattern: /amazonbot/i, type: "Amazon" },
  { pattern: /anthropic-ai/i, type: "Claude AI" },
  { pattern: /applebot/i, type: "Apple" },
  { pattern: /archive\.org_bot/i, type: "Archive.org" },
  { pattern: /baiduspider/i, type: "Baidu" },
  { pattern: /bingbot/i, type: "Bing" },
  { pattern: /bytespider/i, type: "ByteDance" },
  { pattern: /chrome-lighthouse/i, type: "Lighthouse" },
  { pattern: /claude-searchbot/i, type: "Claude Search" },
  { pattern: /claude-user/i, type: "Claude User" },
  { pattern: /claudebot/i, type: "Claude Bot" },
  { pattern: /curl/i, type: "cURL" },
  { pattern: /discordbot/i, type: "Discord" },
  { pattern: /dotbot/i, type: "DotBot" },
  { pattern: /duckduckbot/i, type: "DuckDuck" },
  { pattern: /ev-crawler/i, type: "Headline" },
  { pattern: /exabot/i, type: "Exabot" },
  { pattern: /facebookexternalhit/i, type: "Facebook" },
  { pattern: /findfiles.net/i, type: "FindFiles" },
  { pattern: /googlebot/i, type: "Google" },
  { pattern: /gptbot|chatgpt-user/i, type: "ChatGPT" },
  { pattern: /headlesschrome/i, type: "Headless Chrome" },
  { pattern: /ia_archiver/i, type: "Alexa" },
  { pattern: /lighthouse/i, type: "Lighthouse" },
  { pattern: /linkedinbot/i, type: "LinkedIn" },
  { pattern: /meta-externalagent/i, type: "Meta" },
  { pattern: /mj12bot/i, type: "MajesticBot" },
  { pattern: /oai-searchbot/i, type: "OpenAI Search" },
  { pattern: /perplexitybot/i, type: "Perplexity" },
  { pattern: /phantomjs/i, type: "PhantomJS" },
  { pattern: /pingdom/i, type: "Pingdom" },
  { pattern: /python-requests/i, type: "Python Requests" },
  { pattern: /rogerbot/i, type: "Rogerbot" },
  { pattern: /rss-is-dead.lol/i, type: "RSS is Dead" },
  { pattern: /saasbrowser.com/i, type: "SaaS Browser" },
  { pattern: /scrapy/i, type: "Scrapy" },
  { pattern: /selenium/i, type: "Selenium" },
  { pattern: /semrushbot/i, type: "SEMrush" },
  { pattern: /slackbot/i, type: "Slack" },
  { pattern: /slurp/i, type: "Yahoo Slurp" },
  { pattern: /telegrambot/i, type: "Telegram" },
  { pattern: /twitterbot/i, type: "Twitter" },
  { pattern: /uptimerobot/i, type: "UptimeRobot" },
  { pattern: /webdriver/i, type: "WebDriver" },
  { pattern: /wget/i, type: "wget" },
  { pattern: /whatsapp/i, type: "WhatsApp" },
  { pattern: /yandexbot/i, type: "Yandex" },
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
