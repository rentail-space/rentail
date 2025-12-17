import { generateRobotsTxt } from "@forge42/seo-tools/robots";

export async function loader() {
  const robotsTxt = generateRobotsTxt([
    {
      // NOTE: userAgent must show first
      userAgent: "*",
      allow: ["/", "/api/query"],
      disallow: ["/api/*", "/chat", "/auth", "/error"],
      sitemap: ["https://rentail.space/sitemap.xml"],
    },
  ]);

  // Add comment about API endpoint for AI assistants
  const withComment = `# API for AI assistants: https://rentail.space/api/query
# OpenAPI spec: https://rentail.space/openapi.json

${robotsTxt}`;

  return new Response(withComment, {
    headers: { "Content-Type": "text/plain" },
  });
}
