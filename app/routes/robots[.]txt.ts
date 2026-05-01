import { generateRobotsTxt } from "@forge42/seo-tools/robots";

export async function loader() {
  const robotsTxt = generateRobotsTxt([
    // AI bots get full access so they can index content for citations
    { userAgent: "GPTBot", allow: ["/"] },
    { userAgent: "ChatGPT-User", allow: ["/"] },
    { userAgent: "ClaudeBot", allow: ["/"] },
    { userAgent: "anthropic-ai", allow: ["/"] },
    { userAgent: "PerplexityBot", allow: ["/"] },
    { userAgent: "Googlebot", allow: ["/"] },
    { userAgent: "Google-Extended", allow: ["/"] },
    { userAgent: "Bingbot", allow: ["/"] },
    { userAgent: "Applebot", allow: ["/"] },
    { userAgent: "Applebot-Extended", allow: ["/"] },
    { userAgent: "CCBot", allow: ["/"] },
    { userAgent: "Bytespider", allow: ["/"] },
    { userAgent: "Meta-ExternalAgent", allow: ["/"] },
    { userAgent: "Amazonbot", allow: ["/"] },
    {
      userAgent: "*",
      allow: ["/", "/api/query"],
      disallow: ["/api/*", "/chat", "/auth", "/error"],
      sitemap: [
        "https://rentail.space/sitemap.xml",
        "https://rentail.space/sitemap.txt",
      ],
    },
  ]);

  const withComment = `# API for AI assistants: https://rentail.space/api/query
# OpenAPI spec: https://rentail.space/openapi.json

${robotsTxt}`;

  return new Response(withComment, {
    headers: { "Content-Type": "text/plain" },
  });
}
