/**
 * API Usage Tracking
 *
 * Tracks API requests and costs for billing monitoring
 */

import { invariant } from "es-toolkit";
import prisma from "~/lib/prisma.server";

/**
 * API pricing configuration
 */
const API_PRICING = {
  "google-places": {
    "nearby-search": 0.032,
    photo: 0.007,
    "place-details": 0.017,
  },
  "google-geocoding": {
    geocode: 0.005,
  },
  serpapi: {
    search: 0.01,
  },
} as Record<string, Record<string, number>>;

/**
 * Free tier limits (shared $200/month credit for Google APIs)
 */
const FREE_TIER_LIMITS = {
  "google-combined": 200, // Combined credit for all Google APIs
  serpapi: 100, // Free searches per month
} as const;

type Service = keyof typeof API_PRICING;
type Endpoint<S extends Service> = keyof (typeof API_PRICING)[S];

/**
 * Track an API request
 *
 * @param service API service name
 * @param endpoint Specific endpoint called
 * @returns Promise that resolves when tracking is complete
 */
export async function trackApiCall<S extends Service, T>(
  service: S,
  endpoint: Endpoint<S>,
  fn: () => Promise<T>,
): Promise<T> {
  const month = new Date().toISOString().slice(0, 7); // "2026-01"
  const cost = API_PRICING[service][endpoint];
  invariant(cost, `Unknown cost for ${service} ${String(endpoint)}`);

  // Run the function and track the cost
  try {
    return await fn();
  } finally {
    await prisma.apiUsage.upsert({
      where: {
        service_endpoint_month: {
          service,
          endpoint: endpoint as string,
          month,
        },
      },
      update: {
        count: { increment: 1 },
        cost: { increment: cost },
      },
      create: {
        service,
        endpoint: endpoint as string,
        month,
        count: 1,
        cost,
      },
    });
  }
}

/**
 * Get usage summary for current month
 */
export async function getCurrentMonthUsage() {
  const month = new Date().toISOString().slice(0, 7);

  const usage = await prisma.apiUsage.findMany({
    where: { month },
  });

  // Group by service
  const googleServices = usage.filter((u) => u.service.startsWith("google-"));
  const serpapiUsage = usage.filter((u) => u.service === "serpapi");

  const googleTotal = googleServices.reduce((sum, u) => sum + u.cost, 0);
  const googleCount = googleServices.reduce((sum, u) => sum + u.count, 0);
  const serpapiCount = serpapiUsage.reduce((sum, u) => sum + u.count, 0);
  const serpapiTotal = serpapiUsage.reduce((sum, u) => sum + u.cost, 0);

  return {
    month,
    google: {
      services: googleServices,
      totalCost: googleTotal,
      totalCount: googleCount,
      freeTierLimit: FREE_TIER_LIMITS["google-combined"],
      costBeyondFreeTier: Math.max(
        0,
        googleTotal - FREE_TIER_LIMITS["google-combined"],
      ),
      percentUsed: (googleTotal / FREE_TIER_LIMITS["google-combined"]) * 100,
    },
    serpapi: {
      services: serpapiUsage,
      totalCost: serpapiTotal,
      totalCount: serpapiCount,
      freeTierLimit: FREE_TIER_LIMITS.serpapi,
      costBeyondFreeTier:
        serpapiCount > FREE_TIER_LIMITS.serpapi
          ? (serpapiCount - FREE_TIER_LIMITS.serpapi) * 0.01
          : 0,
      percentUsed: (serpapiCount / FREE_TIER_LIMITS.serpapi) * 100,
    },
  };
}

/**
 * Get historical usage data
 *
 * @param months Number of months to retrieve (default: 6)
 */
export async function getHistoricalUsage(months = 6) {
  const currentDate = new Date();
  const monthsArray: string[] = [];

  for (let i = 0; i < months; i++) {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() - i);
    monthsArray.push(date.toISOString().slice(0, 7));
  }

  const usage = await prisma.apiUsage.findMany({
    where: {
      month: { in: monthsArray },
    },
    orderBy: { month: "desc" },
  });

  return monthsArray.map((month) => {
    const monthUsage = usage.filter((u) => u.month === month);
    const googleUsage = monthUsage.filter((u) =>
      u.service.startsWith("google-"),
    );
    const serpapiUsage = monthUsage.filter((u) => u.service === "serpapi");

    return {
      month,
      google: {
        cost: googleUsage.reduce((sum, u) => sum + u.cost, 0),
        count: googleUsage.reduce((sum, u) => sum + u.count, 0),
      },
      serpapi: {
        cost: serpapiUsage.reduce((sum, u) => sum + u.cost, 0),
        count: serpapiUsage.reduce((sum, u) => sum + u.count, 0),
      },
    };
  });
}

/**
 * Check if usage has exceeded threshold and requires alert
 *
 * @param threshold Percentage threshold (default: 80%)
 */
export async function checkUsageThreshold(threshold = 80) {
  const usage = await getCurrentMonthUsage();

  const alerts = [];

  if (usage.google.percentUsed >= threshold)
    alerts.push({
      service: "Google APIs",
      percentUsed: usage.google.percentUsed,
      totalCost: usage.google.totalCost,
      limit: usage.google.freeTierLimit,
    });

  if (usage.serpapi.percentUsed >= threshold)
    alerts.push({
      service: "SerpAPI",
      percentUsed: usage.serpapi.percentUsed,
      totalCount: usage.serpapi.totalCount,
      limit: usage.serpapi.freeTierLimit,
    });

  return alerts;
}
