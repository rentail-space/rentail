#!/usr/bin/env tsx

import { green, plot } from "asciichart";
import envVars from "~/lib/env";

interface LogEntry {
  timestamp: string;
  message: string;
}

interface MetricsData {
  cpuValues: number[];
  timestamps: Date[];
  min: number;
  max: number;
  avg: number;
}

interface TimeRange {
  label: string;
  durationMs: number;
  step: number;
}

const timeRanges: TimeRange[] = [
  { label: "30m", durationMs: 30 * 60 * 1000, step: 20 },
  { label: "4h", durationMs: 4 * 60 * 60 * 1000, step: 150 },
  { label: "24h", durationMs: 24 * 60 * 60 * 1000, step: 900 },
  { label: "72h", durationMs: 72 * 60 * 60 * 1000, step: 2500 },
  { label: "7d", durationMs: 7 * 24 * 60 * 60 * 1000, step: 5000 },
];

let currentView: "logs" | "metrics" = "logs";
let currentTimeRange = timeRanges[4];
let logs: LogEntry[] = [];
let metrics: MetricsData | null = null;
let scrollOffset = 0;

const ANSI = {
  clear: "\x1b[2J",
  home: "\x1b[H",
  hideCursor: "\x1b[?25l",
  showCursor: "\x1b[?25h",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
};

function getVisibleLines(): number {
  const termHeight = process.stdout.rows || 24;
  const headerLines = 2;
  const positionLine = 1;
  return Math.max(1, termHeight - headerLines - positionLine);
}

function clampScrollOffset(
  offset: number,
  totalLogs: number,
  visibleLines: number,
): number {
  const maxOffset = Math.max(0, totalLogs - visibleLines);
  return Math.max(0, Math.min(offset, maxOffset));
}

async function fetchLogs(): Promise<LogEntry[]> {
  const response = await fetch(
    `https://coolify.labnotes.org/api/v1/applications/c12diz0deab7ctmllamdugyg/logs?lines=1000`,
    { headers: { Authorization: `Bearer ${envVars.COOLIFY_TOKEN}` } },
  );
  const { logs: logsText } = (await response.json()) as { logs: string };
  return logsText
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
      return {
        timestamp: match?.[1] ?? "",
        message: line.replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\S*\s*/, ""),
      };
    })
    .reverse();
}

async function fetchMetrics(): Promise<MetricsData> {
  const end = new Date().toISOString();
  const start = new Date(
    Date.now() - currentTimeRange.durationMs,
  ).toISOString();
  const step = currentTimeRange.step;
  const response = await fetch(
    `https://api.hetzner.cloud/v1/servers/128798634/metrics?type=cpu&start=${start}&end=${end}&step=${step}`,
    { headers: { Authorization: `Bearer ${envVars.HETZNER_TOKEN}` } },
  );
  const { metrics } = (await response.json()) as {
    metrics: { time_series: { cpu: { values: [number, string][] } } };
  };
  const values = metrics.time_series.cpu.values;
  const cpuValues = values.map(([, v]) => parseFloat(v));
  const timestamps = values.map(([t]) => new Date(t * 1000));
  return {
    cpuValues,
    timestamps,
    min: Math.min(...cpuValues),
    max: Math.max(...cpuValues),
    avg: cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length,
  };
}

function render() {
  const lines: string[] = [];
  const termWidth = process.stdout.columns || 80;

  const logsTab =
    currentView === "logs"
      ? `${ANSI.bold}[Logs]${ANSI.reset}`
      : `${ANSI.dim}[Logs]${ANSI.reset}`;
  const metricsTab =
    currentView === "metrics"
      ? `${ANSI.bold}[Metrics]${ANSI.reset}`
      : `${ANSI.dim}[Metrics]${ANSI.reset}`;
  lines.push(
    `${ANSI.cyan}rentail.space${ANSI.reset}  ${logsTab}  ${metricsTab}  ${ANSI.dim}(Tab to switch, 1-5 for time range, q to quit)${ANSI.reset}`,
  );
  lines.push("─".repeat(termWidth));

  if (currentView === "metrics") {
    const timeRangeOptions = timeRanges
      .map((range) => {
        const isSelected = range === currentTimeRange;
        const label = `[${range.label}]`;
        return isSelected
          ? `${ANSI.bold}${ANSI.green}${label}${ANSI.reset}`
          : `${ANSI.dim}${label}${ANSI.reset}`;
      })
      .join(" ");
    lines.push(`  ${timeRangeOptions}`);
    lines.push("─".repeat(termWidth));
  }

  if (currentView === "logs") {
    if (logs.length === 0) {
      lines.push(`${ANSI.dim}Loading logs...${ANSI.reset}`);
    } else {
      const visibleLines = getVisibleLines();
      scrollOffset = clampScrollOffset(scrollOffset, logs.length, visibleLines);

      const visibleLogs = logs.slice(scrollOffset, scrollOffset + visibleLines);
      for (const log of visibleLogs) {
        const time = log.timestamp
          ? `${ANSI.dim}${log.timestamp}${ANSI.reset} `
          : "";
        const msg = log.message.slice(0, termWidth - 22);
        lines.push(`${time}${msg}`);
      }

      const start = scrollOffset + 1;
      const end = Math.min(scrollOffset + visibleLines, logs.length);
      lines.push(
        `${ANSI.dim}Showing ${start}-${end} of ${logs.length} entries${ANSI.reset}`,
      );
    }
  } else {
    if (!metrics) {
      lines.push(`${ANSI.dim}Loading metrics...${ANSI.reset}`);
    } else {
      lines.push(
        `${ANSI.green} CPU Usage - Last ${currentTimeRange.label} (${metrics.cpuValues.length} samples)${ANSI.reset}`,
      );
      lines.push("");
      const chart = plot(metrics.cpuValues, { height: 10, colors: [green] });
      for (const chartLine of chart.split("\n")) {
        lines.push(chartLine);
      }
      lines.push("");
      lines.push(
        ` Start: ${metrics.timestamps[0]?.toISOString().slice(0, 16)}`,
      );
      lines.push(
        ` End:   ${metrics.timestamps.at(-1)?.toISOString().slice(0, 16)}`,
      );
      lines.push(` Min:   ${metrics.min.toFixed(1)}%`);
      lines.push(` Max:   ${metrics.max.toFixed(1)}%`);
      lines.push(` Avg:   ${metrics.avg.toFixed(1)}%`);
    }
  }

  process.stdout.write(ANSI.clear + ANSI.home);
  process.stdout.write(lines.join("\n"));
}

async function refreshData() {
  try {
    if (currentView === "logs") {
      logs = await fetchLogs();
      scrollOffset = 0;
    } else {
      metrics = await fetchMetrics();
    }
    render();
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

async function main() {
  if (!process.stdin.isTTY) {
    console.error("Error: This script requires an interactive terminal (TTY)");
    console.error("Run directly in your terminal: pnpm tsx scripts/watch.ts");
    process.exit(1);
  }

  const stdin = process.stdin;
  stdin.setRawMode(true);
  stdin.resume();
  process.stdout.write(ANSI.hideCursor);

  const handleKey = async (data: Buffer) => {
    const key = data.toString();
    if (key === "\t") {
      currentView = currentView === "logs" ? "metrics" : "logs";
      scrollOffset = 0;
      render();
      await refreshData();
    } else if (key >= "1" && key <= "5" && currentView === "metrics") {
      const index = parseInt(key) - 1;
      currentTimeRange = timeRanges[index];
      render();
      await refreshData();
    } else if (key === "q" || key === "\u0003") {
      process.stdout.write(ANSI.clear + ANSI.home + ANSI.showCursor);
      stdin.setRawMode(false);
      process.exit(0);
    } else if (currentView === "logs") {
      if (key === "\x1b[A" || key === "k") {
        scrollOffset = clampScrollOffset(
          scrollOffset - 1,
          logs.length,
          getVisibleLines(),
        );
        render();
      } else if (key === "\x1b[B" || key === "j") {
        scrollOffset = clampScrollOffset(
          scrollOffset + 1,
          logs.length,
          getVisibleLines(),
        );
        render();
      } else if (key === "\x1b[H") {
        scrollOffset = Math.max(0, logs.length - getVisibleLines());
        render();
      } else if (key === "\x1b[F") {
        scrollOffset = 0;
        render();
      }
    }
  };

  stdin.on("data", handleKey);

  render();
  await refreshData();

  setInterval(() => {
    void refreshData();
  }, 2000);
}

main().catch((error) => {
  process.stdout.write(ANSI.showCursor);
  console.error(error);
  process.exit(1);
});
