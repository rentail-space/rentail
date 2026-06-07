/**
 * API Usage Tracking
 *
 * Tracks API requests and costs for billing monitoring
 */

import type { InputJsonValue } from "@prisma/client/runtime/client";
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
} satisfies Record<string, Record<string, number>>;

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
 * @param params.service API service name
 * @param params.endpoint - Specific endpoint called
 * @param params.defaultValue - Default value to return if not in production
 * @param params.newerThan - Use cache if the result is newer than this date
 * @param params.key - Cache key (eg `seo:${engine}:${term}`)
 * @param fn - Function to run and track the cost
 * @returns The result of the function and the date it was created
 */
export async function trackApiCall<T, S extends Service>(
  {
    defaultValue,
    endpoint,
    key,
    newerThan,
    service,
  }: {
    defaultValue: T;
    endpoint: Endpoint<S>;
    newerThan: Date;
    key: string;
    service: S;
  },
  fn: () => Promise<T>,
): Promise<{ data: T; createdAt: Date }> {
  return await withCache({ key, newerThan }, async () => {
    if (process.env.NODE_ENV !== "production") return defaultValue;

    const month = new Date().toISOString().slice(0, 7); // "2026-01"
    const cost = Number(API_PRICING[service][endpoint]);
    if (!cost)
      throw new Error(`Unknown cost for ${service} ${String(endpoint)}`);

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
  });
}

async function withCache<T>(
  { newerThan, key }: { newerThan: Date; key: string },
  fn: () => Promise<T>,
): Promise<{ data: T; createdAt: Date }> {
  const cached = await prisma.cache.findUnique({
    where: { key, createdAt: { gte: newerThan } },
  });
  if (cached && cached.value != null)
    return { data: cached.value as unknown as T, createdAt: cached.createdAt };

  const value = await fn();
  const createdAt = new Date();
  if (value != null) {
    await prisma.cache.upsert({
      create: { key, value: value as unknown as InputJsonValue, createdAt },
      update: { value: value as unknown as InputJsonValue, createdAt },
      where: { key },
    });
  }
  return { data: value, createdAt };
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
