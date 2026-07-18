import { safeParseUtm } from "~/lib/utm";

interface SourceInput {
  /** The User-Agent header captured on the first request. */
  userAgent?: string | null;
  /** The Referer header captured on the first request. */
  referrer?: string | null;
  /** The raw UTM JSON stored on the user record. */
  utm?: unknown;
}

const LLM_DOMAINS: ReadonlyArray<{ domains: readonly string[]; name: string }> =
  [
    { domains: ["chatgpt.com"], name: "ChatGPT" },
    { domains: ["perplexity.ai"], name: "Perplexity" },
    { domains: ["claude.ai"], name: "Claude" },
    { domains: ["gemini.google.com"], name: "Gemini" },
    {
      domains: ["copilot.microsoft.com", "bing.com"],
      name: "Copilot",
    },
  ];

const LLM_UA_PATTERNS: ReadonlyArray<{ pattern: RegExp; name: string }> = [
  { name: "ChatGPT", pattern: /GPTBot|ChatGPT-User|OAI-SearchBot/i },
  { name: "Claude", pattern: /ClaudeBot|Claude-Web|anthropic-ai/i },
  { name: "Perplexity", pattern: /PerplexityBot/i },
];

function hostnameOf(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

/**
 * Derive a human-readable source label for a user's first visit.
 *
 * 1. If the visit came from a known LLM (by referrer hostname, utm_source,
 *    or LLM crawler user-agent), name the LLM (e.g. "ChatGPT").
 * 2. Otherwise, if there is a referrer, name the referrer hostname.
 * 3. Otherwise, return "--" to indicate the source is unknown.
 */
export function detectSource(input: SourceInput): string {
  const utm = safeParseUtm(input.utm);
  const referrer = input.referrer || utm?.referer || undefined;
  const referrerHost = referrer ? hostnameOf(referrer) : undefined;

  const sourceDomain = utm?.source || referrerHost;
  if (sourceDomain) {
    for (const llm of LLM_DOMAINS) {
      if (llm.domains.includes(sourceDomain)) return llm.name;
    }
  }

  if (input.userAgent) {
    for (const { pattern, name } of LLM_UA_PATTERNS) {
      if (pattern.test(input.userAgent)) return name;
    }
  }

  if (referrerHost) return referrerHost;

  return "--";
}
