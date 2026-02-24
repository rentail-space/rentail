# Multi-Platform Visibility Monitoring Design

**Date:** 2026-02-23
**Scope:** Extend citation monitoring to Perplexity, Claude, and Gemini alongside existing ChatGPT
**Approach:** One client file per platform, shared runner (Approach A)

## Context

The existing system monitors ChatGPT only, storing `VisibilityRun` records with `platform: "chatgpt"`. The `platform` field is already on the schema. This design adds three new platforms without any schema changes.

## Key Design Decisions

- **Perplexity**: uses web search natively, returns structured citations (like ChatGPT)
- **Claude + Gemini**: plain text query only, `citations: []` always — tracks `mentioned` in prose
- **Deduplication**: per-platform (`findFirst` where clause includes `platform`)
- **Cron**: single `/cron/visibility` route, runs all 4 platforms sequentially in one invocation
- **Cadence**: same 10-day cycle for all platforms (tune later)

## Shared Interface

```ts
// app/lib/llm-visibility/types.ts
export type LLMResult = {
  text: string;
  citations: string[]; // empty array for Claude/Gemini
};
```

## Client Files

| File | Provider | Model | Web search | Citations |
|------|----------|-------|------------|-----------|
| `openaiClient.ts` | `@ai-sdk/openai` | `gpt-5-chat-latest` | ✓ (forced) | ✓ |
| `perplexityClient.ts` | `@ai-sdk/openai` + custom baseURL | `sonar` | ✓ (native) | ✓ |
| `claudeClient.ts` | `@ai-sdk/anthropic` (existing) | `claude-haiku-4-5` | ✗ | ✗ |
| `geminiClient.ts` | `@ai-sdk/google` (new) | `gemini-2.0-flash` | ✗ | ✗ |

**New env vars:**
- `PERPLEXITY_API_KEY` — Perplexity API key
- `GOOGLE_GENERATIVE_AI_API_KEY` — Gemini API key (separate from `GOOGLE_MAPS_API_KEY`)

## runPlatform.ts

Shared loop extracted from `runAllQueries`. Signature:

```ts
async function runPlatform({
  platform,
  modelId,
  newerThan,
  queryFn,
}: {
  platform: string;
  modelId: string;
  newerThan: Date;
  queryFn: (query: string) => Promise<LLMResult>;
}): Promise<void>
```

Behavior:
1. `prisma.visibilityRun.findFirst({ where: { platform, createdAt: { gte: newerThan } } })` → skip if found
2. Create `VisibilityRun`
3. Loop: 10 queries × 3 repetitions → call `queryFn` → `analyzeMention` → save `VisibilityCheck`
4. 2s delay between checks

`analyzeMention` and `sleep` live here. `runAllQueries.server.ts` becomes a thin 4-call orchestrator.

## Admin Dashboard

`RecentVisibility.tsx`: platform tab bar (ChatGPT | Perplexity | Claude | Gemini | All), shows most recent run for selected platform.

`VisibilityCharts.tsx`: one series per platform on shared charts, or platform filter.

## Email Alert

`SummarySection`: one row per platform, visibility % trend across last 5 runs for that platform.
`LatestRunTable`: ChatGPT only (most established baseline for per-query breakdown).

## Implementation Tasks

| Task | ID | Blocked by |
|------|----|------------|
| Install @ai-sdk/google + env vars | #17 | — |
| Create types.ts + update openaiClient | #18 | #17 |
| Create perplexityClient.ts | #19 | #17, #18 |
| Create claudeClient.ts | #20 | #18 |
| Create geminiClient.ts | #21 | #17, #18 |
| Extract runPlatform.ts + update runAllQueries | #22 | #19, #20, #21 |
| Update admin dashboard | #23 | #22 |
| Update email alert | #24 | #22 |
