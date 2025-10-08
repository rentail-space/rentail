/**
 * Detect if a request is from a monitoring service (BetterStack, Checkly)
 * based on User-Agent header.
 *
 * User-Agent detection is more reliable than IP-based detection since:
 * - BetterStack IPs change frequently without notice
 * - Checkly IPs require fetching from their API
 *
 * For IP-based detection, you would need to:
 * 1. Fetch IPs from https://uptime.betterstack.com/ips.txt (BetterStack)
 * 2. Fetch IPs from Checkly API (see https://www.checklyhq.com/docs/monitoring/allowlisting/)
 * 3. Cache the lists and refresh hourly via cron
 *
 * Example IP-based implementation:
 * ```typescript
 * const clientIP = request.headers.get("x-forwarded-for")?.split(",")[0];
 * if (clientIP && CACHED_MONITORING_IPS.has(clientIP)) return true;
 * ```
 *
 * @param request - The incoming request
 * @returns true if request is from a monitoring service
 */
export function isMonitoringRequest(request: Request): boolean {
  const userAgent = request.headers.get("user-agent") ?? "";
  return (
    userAgent.includes("UptimeRobot") ||
    userAgent.includes("StatusCake") ||
    userAgent.includes("Pingdom") ||
    userAgent.includes("Checkly") ||
    userAgent.includes("Better Uptime Bot")
  );
}
