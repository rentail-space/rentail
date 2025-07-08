// Push metrics to BetterStack

import os from "node:os";
import { isProduction, serverConfig } from "./config";

const startTime = Date.now() / 1000;

export async function pushGauge(
  name: string,
  value: number,
  tags?: Record<string, string>,
) {
  await pushToPrometheus([{ name, gauge: { value }, tags }]);
}

export async function pushCounter(
  name: string,
  value: number,
  tags?: Record<string, string>,
) {
  await pushToPrometheus([{ name, counter: { value }, tags }]);
}

export async function pushHTTPResponse({
  statusCode,
  duration,
  request,
}: {
  statusCode: number;
  duration: number;
  request: Request;
}) {
  await pushToPrometheus([
    {
      name: "events_count",
      counter: { value: 1 },
      tags: {
        method: request.method,
        path: new URL(request.url).pathname,
        referrer: request.headers.get("Referer") ?? "",
        status: statusCode.toString(),
      },
    },
    {
      name: "response_status_code",
      histogram: {
        buckets: [
          { count: 0, upper_limit: 200 },
          { count: 0, upper_limit: 300 },
          { count: 0, upper_limit: 400 },
          { count: 0, upper_limit: 500 },
        ],
        count: 1,
        sum: statusCode,
      },
    },
    {
      name: "http_request_duration_seconds",
      histogram: {
        buckets: [
          { count: 0, upper_limit: 100 },
          { count: 0, upper_limit: 500 },
          { count: 0, upper_limit: 1000 },
          { count: 0, upper_limit: 5000 },
          { count: 0, upper_limit: 10000 },
        ],
        count: 1,
        sum: duration,
      },
    },
  ]);
}

export async function pushProcessMetrics() {
  await pushToPrometheus([
    {
      name: "nodejs_active_resources",
      gauge: { value: process.getActiveResourcesInfo().length },
    },
    {
      name: "nodejs_external_memory_bytes",
      gauge: { value: process.memoryUsage().external },
    },
    {
      name: "nodejs_heap_size_total_bytes",
      gauge: { value: process.memoryUsage().heapTotal },
    },
    {
      name: "nodejs_heap_size_used_bytes",
      gauge: { value: process.memoryUsage().heapUsed },
    },
    {
      name: "nodejs_heap_space_size_available_bytes",
      gauge: {
        value: process.memoryUsage().heapTotal - process.memoryUsage().heapUsed,
      },
    },
    {
      name: "nodejs_heap_space_size_total_bytes",
      gauge: { value: process.memoryUsage().heapTotal },
    },
    {
      name: "nodejs_heap_space_size_used_bytes",
      gauge: { value: process.memoryUsage().heapUsed },
    },
    {
      name: "nodejs_version_info",
      gauge: { value: Number(process.versions.node) },
    },
    {
      name: "process_cpu_system_seconds_total",
      gauge: { value: process.cpuUsage().system / 1000 },
    },
    {
      name: "process_cpu_user_seconds_total",
      gauge: { value: process.cpuUsage().user / 1000 },
    },
    {
      name: "process_resident_memory_bytes",
      gauge: { value: process.memoryUsage().rss },
    },
    {
      name: "process_start_time_seconds",
      gauge: { value: Math.floor(startTime) },
    },
    ...os.cpus().map((cpu, index) => ({
      name: "node_cpu_seconds_total",
      gauge: { value: cpu.times.user },
      tags: { cpu: index.toString() },
    })),
  ]);

  const baseTime = process.hrtime();

  function measureLap() {
    const diff = process.hrtime(baseTime); // [seconds, nanoseconds]
    const lagInSeconds = diff[0] + diff[1] / 1e9;
    pushToPrometheus([
      { name: "nodejs_eventloop_lag_seconds", gauge: { value: lagInSeconds } },
    ]);
  }

  setImmediate(measureLap);
}

const url = serverConfig.PUSHGATEWAY_URL;
const token = serverConfig.PUSHGATEWAY_TOKEN;

async function pushToPrometheus(
  metrics: Array<
    { name: string; tags?: Record<string, string> } & (
      | {
          counter: { value: number };
        }
      | {
          gauge: { value: number };
        }
      | {
          histogram: {
            buckets: { count: number; upper_limit: number }[];
            count: number;
            sum: number;
          };
        }
      | {
          summary: {
            count: number;
            sum: number;
            quantiles: { quantile: number; value: number }[];
          };
        }
    )
  >,
): Promise<void> {
  if (!isProduction) return;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(
        metrics.map(({ name, tags, ...rest }) => ({
          dt: new Date().toISOString(),
          name,
          tags,
          ...rest,
        })),
      ),
    });
    if (!response.ok) throw new Error(response.statusText);
  } catch (error) {
    console.error("Failed to push metrics", error);
  }
}
