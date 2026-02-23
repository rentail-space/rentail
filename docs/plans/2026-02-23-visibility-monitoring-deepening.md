# Visibility Monitoring Deepening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Deepen ChatGPT citation monitoring by adding a `VisibilityRun` parent model, storing full response text, detecting prose mentions of rentail.space, and running each query 3 times per cron run.

**Architecture:** A new `VisibilityRun` record groups all checks from a single cron invocation. Each of the 10 queries runs 3 times, producing 30 `VisibilityCheck` rows per run linked by `runId`. The admin dashboard and email alert aggregate across repetitions to compute visibility % (`mean(mentioned)`). Run-level deduplication replaces per-check cache-table deduplication.

**Tech Stack:** Prisma ORM, PostgreSQL, AI SDK (`generateText`), OpenAI `gpt-5-chat-latest` with web search, React Router v7, Recharts, React Email + Resend, es-toolkit

---

## Task 1: Schema migration — add VisibilityRun, update VisibilityCheck

**Files:**
- Modify: `prisma/schema.prisma:290-299`

**Context:** The current `VisibilityCheck` model has: `category`, `citations`, `createdAt`, `id`, `model`, `query`. We need to add a `VisibilityRun` parent and new fields to `VisibilityCheck`. The existing rows will be orphaned (no `runId`) — that's acceptable; the dashboard query uses a 90-day window and existing data will be migrated away naturally.

**Step 1: Edit prisma/schema.prisma**

Replace the current `VisibilityCheck` model block (lines 290–299) with:

```prisma
model VisibilityRun {
  id        String            @id @default(cuid())
  createdAt DateTime          @default(now()) @map("created_at")
  platform  String            @map("platform")
  model     String            @map("model")
  checks    VisibilityCheck[]

  @@map("visibility_runs")
}

model VisibilityCheck {
  id         String        @id @default(cuid())
  createdAt  DateTime      @default(now()) @map("created_at")
  runId      String        @map("run_id")
  run        VisibilityRun @relation(fields: [runId], references: [id])
  repetition Int           @map("repetition")
  query      String        @map("query")
  category   String        @map("category")
  response   String        @map("response")
  mentioned  Boolean       @map("mentioned")
  position   Int?          @map("position")
  citations  String[]      @map("citations")

  @@map("visibility_checks")
}
```

**Step 2: Generate client and create migration**

```bash
pnpm prisma migrate dev --name add-visibility-run
```

Expected: migration file created, Prisma client regenerated without errors.

**Step 3: Verify types compile**

```bash
pnpm check
```

Expected: No TypeScript errors. (Existing code referencing `VisibilityCheck` will break — that's expected and fixed in Tasks 3–5.)

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "✨ feat(visibility): add VisibilityRun model and deepen VisibilityCheck schema"
```

---

## Task 2: Update queryChatGPTWithSearch to return response text

**Files:**
- Modify: `app/lib/chatgpt-visibility/openaiClient.ts`

**Context:** `generateText` returns a `text` field alongside `sources`. Currently the function discards `text` and returns only `sources`. We need both.

**Step 1: Write the failing test**

Create `test/analyzeMention.test.ts`:

```ts
import { describe, expect, it } from "vitest";
// We'll test analyzeMention here once it exists in Task 3.
// For now, verify the openaiClient return type compiles.
// This file is a placeholder — real tests added in Task 3.
describe("openaiClient", () => {
  it("placeholder — tested via integration", () => {
    expect(true).toBe(true);
  });
});
```

**Step 2: Run test to verify it passes (trivially)**

```bash
pnpx vitest run test/analyzeMention.test.ts
```

Expected: PASS.

**Step 3: Update openaiClient.ts**

Change the function signature and return:

```ts
import { openai } from "@ai-sdk/openai";
import type { LanguageModelV3, LanguageModelV3Source } from "@ai-sdk/provider";
import { generateText } from "ai";

export type ChatGPTResult = {
  sources: LanguageModelV3Source[];
  text: string;
};

export default async function queryChatGPTWithSearch({
  model,
  query,
}: {
  model: LanguageModelV3;
  query: string;
}): Promise<ChatGPTResult> {
  const { sources, text } = await generateText({
    maxOutputTokens: 2000,
    model,
    prompt: [
      {
        role: "system",
        content:
          "You are ChatGPT with web search capabilities. When answering questions, search the web for current information and cite your sources using numbered citations like 【1】, 【2】, etc. Always include a 'Sources:' section at the end with numbered references.",
      },
      {
        role: "user",
        content: [{ text: query, type: "text" }],
      },
    ],
    tools: {
      web_search: openai.tools.webSearch({
        externalWebAccess: true,
        searchContextSize: "high",
        userLocation: {
          type: "approximate",
          city: "Los Angeles",
          region: "California",
        },
      }),
    },
    toolChoice: { type: "tool", toolName: "web_search" },
  });
  return { sources, text };
}
```

**Step 4: Verify types compile**

```bash
pnpm check
```

Expected: Type errors in `runAllQueries.server.ts` (uses old return shape) — those are fixed in Task 3.

**Step 5: Commit**

```bash
git add app/lib/chatgpt-visibility/openaiClient.ts test/analyzeMention.test.ts
git commit -m "✨ feat(visibility): return response text from queryChatGPTWithSearch"
```

---

## Task 3: Add analyzeMention + rewrite runAllQueries

**Files:**
- Modify: `app/lib/chatgpt-visibility/runAllQueries.server.ts`
- Modify: `test/analyzeMention.test.ts`

**Context:** This is the core logic change. Key points:
- `trackApiCall` uses `service: "chatgpt"` which is not in `API_PRICING` — it would throw in production. Drop `trackApiCall` entirely; use `VisibilityRun` existence as deduplication.
- The `delay` import is `from "node_modules/msw/lib/core/delay.mjs"` — wrong. Replace with an inline helper.
- `runSingleQuery` loops 3 times (repetition 1, 2, 3) per query.
- Each check is linked to the parent `VisibilityRun` via `runId`.

**Step 1: Write failing tests for analyzeMention**

Replace contents of `test/analyzeMention.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { analyzeMention } from "~/lib/chatgpt-visibility/runAllQueries.server";

describe("analyzeMention", () => {
  it("returns mentioned=true and position when 'rentail' appears in prose", () => {
    const result = analyzeMention(
      "You should check out Rentail.space for short-term retail leasing.",
    );
    expect(result.mentioned).toBe(true);
    expect(result.position).toBeGreaterThanOrEqual(0);
  });

  it("returns mentioned=false and position=null when brand absent", () => {
    const result = analyzeMention(
      "You can find pop-up space on Storefront or Appear Here.",
    );
    expect(result.mentioned).toBe(false);
    expect(result.position).toBeNull();
  });

  it("is case-insensitive", () => {
    expect(analyzeMention("RENTAIL.SPACE is great").mentioned).toBe(true);
    expect(analyzeMention("rentail is listed").mentioned).toBe(true);
  });

  it("picks the earliest position when multiple keywords match", () => {
    const result = analyzeMention(
      "Visit rentail.space — rentail is the leading platform.",
    );
    expect(result.position).toBe(6); // index of "rentail.space"
  });
});
```

**Step 2: Run to verify they fail**

```bash
pnpx vitest run test/analyzeMention.test.ts
```

Expected: FAIL — `analyzeMention` not exported yet.

**Step 3: Rewrite runAllQueries.server.ts**

```ts
import { openai } from "@ai-sdk/openai";
import type { LanguageModelV3 } from "@ai-sdk/provider";
import { groupBy, orderBy, partition } from "es-toolkit";
import ora from "ora";
import prisma from "~/lib/prisma.server";
import queryChatGPTWithSearch from "./openaiClient";
import queries from "./queries";

const REPETITIONS = 3;
const MODEL_ID = "gpt-5-chat-latest";

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export type MentionResult = {
  mentioned: boolean;
  position: number | null;
};

export function analyzeMention(response: string): MentionResult {
  const text = response.toLowerCase();
  const keywords = ["rentail.space", "rentail"];
  const mentioned = keywords.some((k) => text.includes(k));
  if (!mentioned) return { mentioned: false, position: null };
  const positions = keywords
    .map((k) => text.indexOf(k))
    .filter((i) => i >= 0);
  return { mentioned: true, position: Math.min(...positions) };
}

export type RunSummary = {
  runId: string;
  createdAt: Date;
  checkCount: number;
};

/**
 * Creates a VisibilityRun and runs all queries × REPETITIONS times.
 * Skips if a run already exists newer than newerThan.
 */
export default async function runAllQueries({
  newerThan,
}: {
  newerThan: Date;
}): Promise<[string, RunSummary][]> {
  // Deduplication at run level
  const existing = await prisma.visibilityRun.findFirst({
    where: { createdAt: { gte: newerThan } },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    console.info("Skipping — run already exists:", existing.id);
  } else {
    const model = openai(MODEL_ID);
    const run = await prisma.visibilityRun.create({
      data: { platform: "chatgpt", model: MODEL_ID },
    });
    console.info(`Created run ${run.id}`);

    for (let qi = 0; qi < queries.length; qi++) {
      const query = queries[qi];
      console.info(`Query ${qi + 1}/${queries.length}: ${query.query}`);

      for (let rep = 1; rep <= REPETITIONS; rep++) {
        await runSingleCheck({ model, run, query, repetition: rep });
        await sleep(2_000);
      }
    }
  }

  // Return all runs grouped by date for email/charts
  const all = await prisma.visibilityRun.findMany({
    include: { checks: true },
    orderBy: { createdAt: "asc" },
  });
  const byDate = Object.entries(
    groupBy(all, ({ createdAt }) => createdAt.toISOString().slice(0, 10)),
  );
  return orderBy(byDate, [([date]) => date], ["asc"]);
}

async function runSingleCheck({
  model,
  run,
  query,
  repetition,
}: {
  model: LanguageModelV3;
  run: { id: string };
  query: { query: string; category: string };
  repetition: number;
}) {
  const spinner = ora(
    `Rep ${repetition}/${REPETITIONS}: ${query.query}`,
  ).start();

  try {
    const { sources, text } = await queryChatGPTWithSearch({
      model,
      query: query.query,
    });
    const citations = sources
      .filter((s) => s.sourceType === "url")
      .map((s) => s.url);
    const { mentioned, position } = analyzeMention(text);
    const [rentailCitations] = partition(
      citations,
      (url) => new URL(url).hostname === "rentail.space",
    );
    const isFirstPlace =
      citations.length > 0 &&
      new URL(citations[0]).hostname === "rentail.space";
    const score = (isFirstPlace ? 50 : 0) + rentailCitations.length * 10;
    spinner.succeed(
      `score=${score} mentioned=${mentioned} citations=${citations.length}`,
    );

    await prisma.visibilityCheck.create({
      data: {
        runId: run.id,
        repetition,
        query: query.query,
        category: query.category,
        response: text,
        mentioned,
        position,
        citations,
      },
    });
  } catch (error) {
    spinner.fail(`Error: ${error}`);
    throw error;
  }
}
```

**Step 4: Run tests**

```bash
pnpx vitest run test/analyzeMention.test.ts
```

Expected: All 4 tests PASS.

**Step 5: Typecheck**

```bash
pnpm check
```

Expected: Errors in admin dashboard and email (old `Source` type) — fixed in Tasks 4–5.

**Step 6: Commit**

```bash
git add app/lib/chatgpt-visibility/runAllQueries.server.ts test/analyzeMention.test.ts
git commit -m "✨ feat(visibility): add analyzeMention, VisibilityRun grouping, 3 repetitions per query"
```

---

## Task 4: Update admin dashboard

**Files:**
- Modify: `app/routes/admin.visibility/route.tsx`
- Modify: `app/routes/admin.visibility/RecentVisibility.tsx`
- Modify: `app/routes/admin.visibility/VisibilityCharts.tsx`

**Context:** The loader currently returns `VisibilityCheck[]`. It needs to return `VisibilityRun[]` with nested checks. Components aggregate across repetitions.

**Step 1: Update route.tsx loader**

```ts
import prisma from "~/lib/prisma.server";
import { daysAgo } from "~/lib/temporal";
import { verifyAdmin } from "~/lib/sessions.server";
import type { Route } from "./+types/route";
import RecentVisibility from "./RecentVisibility";
import VisibilityCharts from "./VisibilityCharts";

export async function loader({ request }: Route.LoaderArgs) {
  await verifyAdmin(request.headers);

  return await prisma.visibilityRun.findMany({
    include: { checks: true },
    orderBy: { createdAt: "desc" },
    where: {
      createdAt: { gte: daysAgo(90) },
    },
  });
}

export default function VisibilityPage({ loaderData }: Route.ComponentProps) {
  return (
    <section className="space-y-4">
      <h1 className="text-center font-bold text-2xl">
        Recent Visibility Checks
      </h1>
      <RecentVisibility runs={loaderData} />
      <VisibilityCharts runs={loaderData} />
    </section>
  );
}
```

**Step 2: Update RecentVisibility.tsx**

The component receives `runs` and shows the most recent run. One row per unique query, aggregated across its 3 repetitions:

```tsx
import { groupBy, mean, orderBy, sortBy } from "es-toolkit";
import { twMerge } from "tailwind-merge";
import { Card, CardContent } from "~/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/Table";

type Check = {
  category: string;
  citations: string[];
  mentioned: boolean;
  position: number | null;
  query: string;
  repetition: number;
};

type Run = {
  checks: Check[];
  createdAt: Date;
  id: string;
  model: string;
  platform: string;
};

type QueryAggregate = {
  category: string;
  query: string;
  visibilityPct: number;   // mean(mentioned) * 100
  avgCitations: number;    // mean(citations.length)
  score: number;
};

export default function RecentVisibility({ runs }: { runs: Run[] }) {
  if (runs.length === 0) return <p>No runs yet.</p>;

  const mostRecent = orderBy(runs, [(r) => r.createdAt], ["desc"])[0];
  const byQuery = Object.entries(
    groupBy(mostRecent.checks, (c) => c.query),
  ).map(([query, checks]): QueryAggregate => {
    const category = checks[0].category;
    const visibilityPct = mean(checks.map((c) => (c.mentioned ? 1 : 0))) * 100;
    const avgCitations = mean(checks.map((c) => c.citations.length));
    const isFirstPlaceRatio = mean(
      checks.map((c) =>
        c.citations.length > 0 && isRentail(c.citations[0]) ? 1 : 0,
      ),
    );
    const rentailAvg = mean(
      checks.map((c) => c.citations.filter(isRentail).length),
    );
    const score = isFirstPlaceRatio * 50 + rentailAvg * 10;
    return { category, query, visibilityPct, avgCitations, score };
  });
  const rows = sortBy(byQuery, ["category", "query"]);

  return (
    <Card className="bg-secondary-background text-foreground">
      <CardContent>
        <p className="text-sm text-muted-foreground mb-2">
          Run: {mostRecent.createdAt.toISOString().slice(0, 10)} ·{" "}
          {mostRecent.checks.length} checks · {mostRecent.platform} /{" "}
          {mostRecent.model}
        </p>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="font-bold">Category</TableHead>
              <TableHead className="font-bold">Query</TableHead>
              <TableHead className="font-bold">Visibility %</TableHead>
              <TableHead className="font-bold">Avg Citations</TableHead>
              <TableHead className="font-bold">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={index.toString()}
                className={twMerge(
                  row.visibilityPct > 0 ? "bg-green-100" : "",
                  "hover:bg-gray-100",
                )}
              >
                <TableHead className="font-bold">{row.category}</TableHead>
                <TableCell>{row.query}</TableCell>
                <TableCell className={row.visibilityPct > 0 ? "font-bold" : ""}>
                  {row.visibilityPct.toFixed(0)}%
                </TableCell>
                <TableCell>{row.avgCitations.toFixed(1)}</TableCell>
                <TableCell>{row.score.toFixed(0)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableHead colSpan={2}>Totals</TableHead>
              <TableHead>
                {mean(rows.map((r) => r.visibilityPct)).toFixed(0)}%
              </TableHead>
              <TableHead>
                {mean(rows.map((r) => r.avgCitations)).toFixed(1)}
              </TableHead>
              <TableHead>
                {mean(rows.map((r) => r.score)).toFixed(0)}
              </TableHead>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}

function isRentail(url: string): boolean {
  try {
    return new URL(url).hostname === "rentail.space";
  } catch {
    return false;
  }
}
```

**Step 3: Update VisibilityCharts.tsx**

One data point per run, plotting mean visibility % across all queries:

```tsx
import { mean } from "es-toolkit";
import { BarChartIcon, PercentIcon, StarIcon } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  type DataKey,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "~/components/ui/Card";

type Check = {
  citations: string[];
  mentioned: boolean;
};

type Run = {
  checks: Check[];
  createdAt: Date;
  id: string;
};

type RunPoint = {
  date: string;
  visibilityPct: number;
  citationRatio: number;
  score: number;
};

const chartConfig = {
  visibilityPct: {
    label: "Visibility %",
    icon: PercentIcon,
    color: "var(--chart-1)",
  },
  citationRatio: {
    label: "Citation Ratio",
    icon: BarChartIcon,
    color: "var(--chart-3)",
  },
  score: {
    label: "Score",
    icon: StarIcon,
    color: "var(--chart-2)",
  },
};

export default function VisibilityCharts({ runs }: { runs: Run[] }) {
  const points: RunPoint[] = runs
    .slice()
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((run) => {
      const checks = run.checks;
      const visibilityPct =
        mean(checks.map((c) => (c.mentioned ? 1 : 0))) * 100;
      const citationRatio = mean(
        checks.map((c) => {
          const rentail = c.citations.filter(isRentail).length;
          return c.citations.length > 0 ? rentail / c.citations.length : 0;
        }),
      );
      const score = mean(
        checks.map((c) => {
          const isFirst =
            c.citations.length > 0 && isRentail(c.citations[0]);
          const rentailCount = c.citations.filter(isRentail).length;
          return (isFirst ? 50 : 0) + rentailCount * 10;
        }),
      );
      return {
        date: run.createdAt.toISOString().slice(0, 10),
        visibilityPct,
        citationRatio,
        score,
      };
    });

  return (
    <Card className="bg-secondary-background text-foreground">
      <CardContent className="grid gap-4 md:grid-cols-2">
        {Object.entries(chartConfig).map(([key, value]) => (
          <AreaChart
            key={key}
            data={points}
            height={200}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            responsive={false}
            width={450}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} tickLine={false} tickMargin={8} />
            <Area
              activeDot={{ fill: "var(--chart-active-dot)" }}
              dataKey={key as DataKey<RunPoint>}
              fill={value.color}
              name={value.label}
              type="monotone"
            />
            <Legend />
            <Tooltip
              content={({ payload, label }) => (
                <div className="flex w-full flex-row gap-2 bg-background p-2">
                  <span>{label}</span>
                  <span>{payload?.[0]?.name}</span>
                  <span className="text-right font-bold">
                    {payload?.[0]?.value}
                  </span>
                </div>
              )}
            />
          </AreaChart>
        ))}
      </CardContent>
    </Card>
  );
}

function isRentail(url: string): boolean {
  try {
    return new URL(url).hostname === "rentail.space";
  } catch {
    return false;
  }
}
```

**Step 4: Typecheck**

```bash
pnpm check
```

Expected: No errors in admin dashboard files. Email alert may still have errors (fixed in Task 5).

**Step 5: Commit**

```bash
git add app/routes/admin.visibility/
git commit -m "✨ feat(visibility): update admin dashboard to use VisibilityRun with repetition aggregates"
```

---

## Task 5: Update email alert

**Files:**
- Modify: `app/lib/chatgpt-visibility/EmailVisibilityAlert.server.tsx`

**Context:** `sendVisibilityAlert` calls `runAllQueries` which now returns `[string, RunSummary][]` — but the email uses `Source[]` per date entry. We need to update the email to work with `VisibilityRun[]` instead. The simplest approach: call `prisma.visibilityRun.findMany` directly in the email for the last 5 runs, compute visibility % per run.

**Step 1: Rewrite EmailVisibilityAlert.server.tsx**

```tsx
import { Button, Section } from "@react-email/components";
import { mean, orderBy } from "es-toolkit";
import EmailLayout from "~/emails/EmailLayout";
import { sendEmail } from "~/emails/sendEmails.server";
import * as styles from "~/emails/styles";
import prisma from "~/lib/prisma.server";
import { daysAgo } from "~/lib/temporal";
import runAllQueries from "./runAllQueries.server";

type Check = {
  category: string;
  citations: string[];
  mentioned: boolean;
  query: string;
  repetition: number;
};

type Run = {
  checks: Check[];
  createdAt: Date;
  id: string;
};

export default async function sendVisibilityAlert(): Promise<string> {
  await runAllQueries({ newerThan: daysAgo(10) });

  const runs = await prisma.visibilityRun.findMany({
    include: { checks: true },
    orderBy: { createdAt: "asc" },
    where: { createdAt: { gte: daysAgo(90) } },
  });

  await sendEmail({
    email: "assaf@labnotes.org",
    subject: "Visibility Alert",
    content: () => (
      <EmailLayout subject="Rentail visibility in ChatGPT queries">
        <SummarySection runs={runs} />
        <LatestRunTable runs={runs} />
        <Button
          href="https://rentail.space/admin/visibility"
          style={styles.button}
        >
          Charts and Graphs
        </Button>
      </EmailLayout>
    ),
  });

  return "OK";
}

function runVisibilityPct(run: Run): number {
  if (run.checks.length === 0) return 0;
  return mean(run.checks.map((c) => (c.mentioned ? 1 : 0))) * 100;
}

function SummarySection({ runs }: { runs: Run[] }) {
  const last5 = runs.slice(-5);
  const progression = last5.map(
    (run) =>
      `${run.createdAt.toISOString().slice(0, 10)}: ${runVisibilityPct(run).toFixed(0)}%`,
  );

  return (
    <Section>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 8,
          marginBottom: 8,
          background: "#fff",
        }}
        cellPadding={8}
        border={1}
      >
        <tbody>
          <tr>
            <th align="left" style={{ background: "#e5e7eb", whiteSpace: "nowrap" }}>
              Visibility % (last 5 runs)
            </th>
            <td>{progression.join(" → ")}</td>
          </tr>
          <tr>
            <th align="left" style={{ background: "#e5e7eb", whiteSpace: "nowrap" }}>
              Latest run
            </th>
            <td>
              {runs.at(-1)?.createdAt.toISOString().slice(0, 10) ?? "—"}
            </td>
          </tr>
          <tr>
            <th align="left" style={{ background: "#e5e7eb", whiteSpace: "nowrap" }}>
              Total runs tracked
            </th>
            <td>{runs.length}</td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

function LatestRunTable({ runs }: { runs: Run[] }) {
  const latestRun = runs.at(-1);
  if (!latestRun) return null;

  // Aggregate by query across repetitions
  const byQuery = Object.entries(
    latestRun.checks.reduce(
      (acc, c) => {
        if (!acc[c.query]) acc[c.query] = { category: c.category, checks: [] };
        acc[c.query].checks.push(c);
        return acc;
      },
      {} as Record<string, { category: string; checks: Check[] }>,
    ),
  )
    .map(([query, { category, checks }]) => ({
      query,
      category,
      visibilityPct: mean(checks.map((c) => (c.mentioned ? 1 : 0))) * 100,
      avgCitations: mean(checks.map((c) => c.citations.length)),
    }))
    .sort((a, b) =>
      a.category.localeCompare(b.category) || a.query.localeCompare(b.query),
    );

  return (
    <Section>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 16,
          marginBottom: 16,
          background: "#fff",
        }}
        cellPadding={8}
        border={1}
      >
        <thead>
          <tr>
            <th align="left" style={{ background: "#e5e7eb", whiteSpace: "nowrap" }}>
              Query
            </th>
            <th align="center" style={{ background: "#e5e7eb", whiteSpace: "nowrap" }}>
              Visibility %
            </th>
            <th align="center" style={{ background: "#e5e7eb", whiteSpace: "nowrap" }}>
              Avg Citations
            </th>
          </tr>
        </thead>
        <tbody>
          {byQuery.map((row) => (
            <tr key={row.query}>
              <td align="left">
                <strong>{row.category}</strong>: {row.query}
              </td>
              <td
                align="center"
                style={{ fontWeight: row.visibilityPct > 0 ? "bold" : "normal" }}
              >
                {row.visibilityPct.toFixed(0)}%
              </td>
              <td align="right">{row.avgCitations.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}
```

**Step 2: Typecheck everything**

```bash
pnpm check
```

Expected: No TypeScript errors across all files.

**Step 3: Run full test suite**

```bash
pnpm test
```

Expected: All tests pass including `analyzeMention`.

**Step 4: Commit**

```bash
git add app/lib/chatgpt-visibility/EmailVisibilityAlert.server.tsx
git commit -m "✨ feat(visibility): update email alert to use VisibilityRun with visibility % trend"
```

---

## Verification

After all tasks complete, verify end-to-end manually:

```bash
# Start dev server
pnpm dev

# In another terminal, trigger the cron route (runs in dev against mock or real API)
curl http://localhost:5173/cron/visibility

# Check DB
pnpm prisma studio
# Confirm: 1 VisibilityRun row, 30 VisibilityCheck rows

# Check admin dashboard
open http://localhost:5173/admin/visibility
```
