# Visibility Monitoring Deepening Design

**Date:** 2026-02-23
**Scope:** ChatGPT citation monitoring — add response text storage, prose mention detection, and 3 repetitions per query
**Approach:** VisibilityRun parent model (Approach B)

## Context

The existing system queries ChatGPT with web search across 10 queries in 4 categories, stores cited URLs, scores them, displays charts in the admin dashboard, and sends email alerts via a cron route. It runs each query once and stores only citation URLs — not the response text, and not whether rentail.space appeared in prose.

The goal is to deepen the existing ChatGPT monitoring before expanding to other platforms.

## Schema

### New model: `VisibilityRun`

```prisma
model VisibilityRun {
  id        String            @id @default(cuid())
  createdAt DateTime          @default(now()) @map("created_at")
  platform  String            @map("platform")
  model     String            @map("model")
  checks    VisibilityCheck[]

  @@map("visibility_runs")
}
```

### Updated model: `VisibilityCheck`

New fields: `runId`, `repetition`, `response`, `mentioned`, `position`
Removed fields: `createdAt`, `model` (moved to `VisibilityRun`)

```prisma
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

A full cron run produces 1 `VisibilityRun` + 30 `VisibilityCheck` rows (10 queries × 3 repetitions).

## Execution Logic

```
cron.visibility → sendVisibilityAlert
  → runAllQueries({ newerThan })
      → check: VisibilityRun exists newer than newerThan? skip
      → prisma.visibilityRun.create({ platform, model })
      → for each query (10):
          → for repetition 1..3:
              → queryChatGPTWithSearch() → { sources, text }
              → analyzeMention(text)    → { mentioned, position }
              → prisma.visibilityCheck.create({ runId, repetition, ... })
              → delay(2s)
```

### `analyzeMention(response: string)`

```ts
const text = response.toLowerCase();
const keywords = ["rentail.space", "rentail"];
const mentioned = keywords.some(k => text.includes(k));
const position = mentioned
  ? Math.min(...keywords.map(k => text.indexOf(k)).filter(i => i >= 0))
  : null;
return { mentioned, position };
```

### Cache key

Updated to include repetition: `seo:${category}:${query}:${repetition}`

### `queryChatGPTWithSearch` return type

Changed from `LanguageModelV3Source[]` to `{ sources: LanguageModelV3Source[], text: string }`.

## Admin Dashboard

**Loader:** `visibilityRun.findMany({ include: { checks: true }, where: { createdAt: { gte: daysAgo(90) } } })`

**RecentVisibility:** One row per query. Aggregates 3 repetitions:
- Visibility % = `mean(mentioned)` (0%, 33%, 67%, or 100%)
- Avg citations = `mean(citations.length)`
- Score = existing formula on averaged values

**VisibilityCharts:** One data point per `VisibilityRun` on the time axis, plotting mean visibility %, citation ratio, and score across all queries in that run.

## Email Alert

`Progression` component shows trend across last 5 runs (not last 5 days). `SummarySection` and `SourcesTable` aggregate from `mentioned` field across repetitions to display visibility %.

## Implementation Tasks

| Task | ID | Blocked by |
|------|----|------------|
| Schema migration: add VisibilityRun | #7 | — |
| Update queryChatGPTWithSearch to return text | #8 | #7 |
| Add analyzeMention + update runAllQueries | #9 | #7, #8 |
| Update admin dashboard | #10 | #7 |
| Update email alert | #11 | #9 |
