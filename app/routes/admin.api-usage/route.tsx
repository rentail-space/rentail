/**
 * Admin API Usage Dashboard
 *
 * Displays current month API usage vs limits, estimated costs, and historical trends
 */

import { Card, CardContent, CardHeader } from "~/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/Table";
import {
  getCurrentMonthUsage,
  getHistoricalUsage,
} from "~/lib/apiUsageTracker";
import { verifyAdmin } from "~/lib/sessions.server";
import type { Route } from "./+types/route";

export async function loader({ request }: Route.LoaderArgs) {
  await verifyAdmin(request.headers);

  const [currentMonth, historical] = await Promise.all([
    getCurrentMonthUsage(),
    getHistoricalUsage(6),
  ]);

  return { currentMonth, historical };
}

export default function AdminApiUsage({ loaderData }: Route.ComponentProps) {
  const { currentMonth, historical } = loaderData;

  return (
    <section className="space-y-6">
      <h1 className="text-center font-bold text-2xl">API Usage Dashboard</h1>

      {/* Current Month Summary */}
      <section className="grid grid-cols-2 gap-4">
        {/* Google APIs Card */}
        <Card
          className={`text-foreground ${
            currentMonth.google.percentUsed >= 80
              ? "border-red-300 bg-red-50"
              : currentMonth.google.percentUsed >= 50
                ? "border-yellow-300 bg-yellow-50"
                : "bg-secondary-background"
          }`}
        >
          <CardHeader>
            <h2 className="font-bold text-lg">Google APIs</h2>
            <p className="text-gray-600 text-sm">
              Shared $200/month credit pool
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-gray-600 text-sm">Current Usage</div>
              <div className="font-bold text-2xl">
                ${currentMonth.google.totalCost.toFixed(2)}
              </div>
              <div className="text-gray-500 text-sm">
                {currentMonth.google.totalCount.toLocaleString()} requests
              </div>
            </div>
            <div>
              <div className="text-gray-600 text-sm">Free Tier</div>
              <div className="font-semibold text-lg">
                ${currentMonth.google.freeTierLimit.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-gray-600">Usage</span>
                <span className="font-semibold">
                  {currentMonth.google.percentUsed.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full ${
                    currentMonth.google.percentUsed >= 80
                      ? "bg-red-500"
                      : currentMonth.google.percentUsed >= 50
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{
                    width: `${Math.min(currentMonth.google.percentUsed, 100)}%`,
                  }}
                />
              </div>
            </div>
            {currentMonth.google.costBeyondFreeTier > 0 && (
              <div className="border-t pt-3">
                <div className="text-red-600 text-sm">
                  Cost Beyond Free Tier
                </div>
                <div className="font-bold text-red-600 text-xl">
                  ${currentMonth.google.costBeyondFreeTier.toFixed(2)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SerpAPI Card */}
        <Card
          className={`text-foreground ${
            currentMonth.serpapi.percentUsed >= 80
              ? "border-red-300 bg-red-50"
              : currentMonth.serpapi.percentUsed >= 50
                ? "border-yellow-300 bg-yellow-50"
                : "bg-secondary-background"
          }`}
        >
          <CardHeader>
            <h2 className="font-bold text-lg">SerpAPI</h2>
            <p className="text-gray-600 text-sm">100 searches/month free</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-gray-600 text-sm">Current Usage</div>
              <div className="font-bold text-2xl">
                {currentMonth.serpapi.totalCount} searches
              </div>
              <div className="text-gray-500 text-sm">
                ${currentMonth.serpapi.totalCost.toFixed(2)} total cost
              </div>
            </div>
            <div>
              <div className="text-gray-600 text-sm">Free Tier</div>
              <div className="font-semibold text-lg">
                {currentMonth.serpapi.freeTierLimit} searches
              </div>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-gray-600">Usage</span>
                <span className="font-semibold">
                  {currentMonth.serpapi.percentUsed.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full ${
                    currentMonth.serpapi.percentUsed >= 80
                      ? "bg-red-500"
                      : currentMonth.serpapi.percentUsed >= 50
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{
                    width: `${Math.min(currentMonth.serpapi.percentUsed, 100)}%`,
                  }}
                />
              </div>
            </div>
            {currentMonth.serpapi.costBeyondFreeTier > 0 && (
              <div className="border-t pt-3">
                <div className="text-red-600 text-sm">
                  Cost Beyond Free Tier
                </div>
                <div className="font-bold text-red-600 text-xl">
                  ${currentMonth.serpapi.costBeyondFreeTier.toFixed(2)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Detailed Breakdown */}
      <Card className="bg-secondary-background text-foreground">
        <CardHeader>
          <h2 className="font-bold text-lg">
            Current Month Breakdown ({currentMonth.month})
          </h2>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">Cost per Request</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ...currentMonth.google.services,
                ...currentMonth.serpapi.services,
              ].map((service) => {
                const pricePerRequest =
                  service.count > 0 ? service.cost / service.count : 0;
                return (
                  <TableRow key={`${service.service}-${service.endpoint}`}>
                    <TableCell className="font-medium">
                      {service.service}
                    </TableCell>
                    <TableCell>{service.endpoint}</TableCell>
                    <TableCell className="text-right">
                      {service.count.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ${pricePerRequest.toFixed(4)}
                    </TableCell>
                    <TableCell className="text-right">
                      ${service.cost.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Historical Trends */}
      <Card className="bg-secondary-background text-foreground">
        <CardHeader>
          <h2 className="font-bold text-lg">
            Historical Usage (Last 6 Months)
          </h2>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Google Requests</TableHead>
                <TableHead className="text-right">Google Cost</TableHead>
                <TableHead className="text-right">SerpAPI Requests</TableHead>
                <TableHead className="text-right">SerpAPI Cost</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historical.map((month) => (
                <TableRow key={month.month}>
                  <TableCell className="font-medium">{month.month}</TableCell>
                  <TableCell className="text-right">
                    {month.google.count.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ${month.google.cost.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {month.serpapi.count.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ${month.serpapi.cost.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ${(month.google.cost + month.serpapi.cost).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pricing Reference */}
      <Card className="bg-secondary-background text-foreground">
        <CardHeader>
          <h2 className="font-bold text-lg">API Pricing Reference</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 font-semibold">Google Places API</h3>
              <ul className="list-inside list-disc space-y-1 text-sm">
                <li>Nearby Search: $0.032 per request</li>
                <li>Place Details: $0.017 per request</li>
                <li>Photo: $0.007 per request</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Google Geocoding API</h3>
              <ul className="list-inside list-disc space-y-1 text-sm">
                <li>Geocoding: $0.005 per request</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">SerpAPI</h3>
              <ul className="list-inside list-disc space-y-1 text-sm">
                <li>Free Tier: 100 searches/month</li>
                <li>Beyond Free Tier: $0.01 per search</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Free Services</h3>
              <ul className="list-inside list-disc space-y-1 text-sm">
                <li>Google Search Console API: Unlimited</li>
                <li>Google Analytics API: Unlimited</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
