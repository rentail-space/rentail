// Push metrics to BetterStack

import { readFileSync } from "node:fs";
import env from "env-var";

export async function pushStatusCodes(statusCode: number) {
  await pushMetrics({
    name: "status_codes",
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
  });
}

export async function pushResponseTime(duration: number) {
  await pushMetrics({
    name: "response_time",
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
  });
}

export async function pushGauge(name: string, value: number) {
  await pushMetrics({
    name,
    gauge: { value },
  });
}

setInterval(() => {
  pushGauge("node_memory_MemTotal_bytes", os.totalmem());
  pushGauge("node_memory_MemFree_bytes", os.freemem());
  pushGauge("node_memory_MemAvailable_bytes", getAvailableMemoryLinux());
}, 5000);

function getAvailableMemoryLinux() {
  try {
    const meminfo = readFileSync("/proc/meminfo", "utf8");
    const match = meminfo.match(/^MemAvailable:\s+(\d+)\skB$/m);
    if (match) return Number.parseInt(match[1], 10) * 1024; // bytes
  } catch {}
  return 0;
}

import os from "node:os";

const url = env.get("PUSHGATEWAY_URL").required().asString();
const token = env.get("PUSHGATEWAY_TOKEN").required().asString();

type Histogram = {
  histogram: {
    buckets: {
      count: number;
      upper_limit: number;
    }[];
    count: number;
    sum: number;
  };
};
type Gauge = {
  gauge: {
    value: number;
  };
};
type Counter = {
  counter: {
    value: number;
  };
};
type Summary = {
  summary: {
    count: number;
    sum: number;
    quantiles: {
      quantile: number;
      value: number;
    }[];
  };
};

async function pushMetrics({
  name,
  ...rest
}: {
  name: string;
} & (Histogram | Gauge | Counter | Summary)) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ dt: new Date().toISOString(), name, ...rest }),
  });
  if (!response.ok)
    throw new Error(`Failed to push metrics: ${response.statusText}`);
}
